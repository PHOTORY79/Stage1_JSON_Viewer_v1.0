import { useState, useCallback, useRef } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { JsonInput } from './components/JsonInput/JsonInput';
import { JsonEditor } from './components/JsonInput/JsonEditor';
import { MetadataView } from './components/Viewer/MetadataView';
import { SynopsisView } from './components/Viewer/SynopsisView';
import { TreatmentView } from './components/Viewer/TreatmentView';
import { ScenarioView } from './components/Viewer/ScenarioView';
import { CharactersView } from './components/Viewer/CharactersView';
import { LocationsView } from './components/Viewer/LocationsView';
import { PropsView } from './components/Viewer/PropsView';
import { ValidationPanel } from './components/Validation/ValidationPanel';
import { Stage1JSON, AppView, ValidationResult, CurrentStep } from './types/stage1.types';
import { parseJson, formatJson } from './utils/jsonParser';
import { mergeJsonFiles, ParsedFile } from './utils/jsonMerger';
import { AlertTriangle } from 'lucide-react';
import { validateStage1Json } from './utils/jsonValidator';

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedJson, setParsedJson] = useState<Stage1JSON | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('empty');
  const [showEditor, setShowEditor] = useState(false);
  const [mergeWarnings, setMergeWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonLoad = useCallback((input: string | ParsedFile[]) => {
    if (Array.isArray(input)) {
      // Handle array of parsed files (Merge scenario)
      const mergeResult = mergeJsonFiles(input);

      if (mergeResult.success && mergeResult.mergedJson) {
        setMergeWarnings(mergeResult.warnings);
        setParsedJson(mergeResult.mergedJson);

        // Format the merged JSON back to string for editor/download
        const mergedJsonStr = formatJson(JSON.stringify(mergeResult.mergedJson));
        setJsonInput(mergedJsonStr);

        // Validate the merged JSON
        const result = parseJson(mergedJsonStr);

        // Apply Semantic Validation if basic parse is valid
        if (result.isValid && mergeResult.mergedJson) {
          const semanticErrors = validateStage1Json(mergeResult.mergedJson);
          result.errors.push(...semanticErrors);
        }

        setValidationResult(result);

        setCurrentView('metadata');
        setShowEditor(false);

        if (mergeResult.errors.length > 0) {
          if (mergeResult.warnings.length > 0) {
            alert(`병합 완료 (경고 ${mergeResult.warnings.length}건)\n` + mergeResult.warnings.slice(0, 5).join('\n'));
          }
        }
      } else {
        // Merge failed
        alert(`병합 실패:\n${mergeResult.errors.join('\n')}`);
      }

    } else {
      // Single string input (legacy/editor path)
      setJsonInput(input);
      setMergeWarnings([]);

      // Parse and validate
      const result = parseJson(input);

      if (result.isValid) {
        try {
          const jsonToUse = result.fixedJson || input;
          const parsed = JSON.parse(jsonToUse) as Stage1JSON;

          // Apply Semantic Validation
          const semanticErrors = validateStage1Json(parsed);
          result.errors.push(...semanticErrors);

          setParsedJson(parsed);
          setValidationResult(result);
          setCurrentView('metadata');
          setShowEditor(false);

          // Update jsonInput with fixed version if auto-fixed
          if (result.fixedJson) {
            setJsonInput(formatJson(result.fixedJson));
          }
        } catch {
          setShowEditor(true);
          setParsedJson(null);
          setValidationResult(result);
        }
      } else {
        setValidationResult(result);
        setShowEditor(true);
        setParsedJson(null);
      }
    }
  }, []);

  const handleJsonUpdate = useCallback((updatedJson: string) => {
    setJsonInput(updatedJson);
  }, []);

  const handleRetry = useCallback(() => {
    handleJsonLoad(jsonInput);
  }, [jsonInput, handleJsonLoad]);

  const handleReset = useCallback(() => {
    setJsonInput('');
    setParsedJson(null);
    setValidationResult(null);
    setMergeWarnings([]);
    setCurrentView('empty');
    setShowEditor(false);
  }, []);

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (files.length === 1) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          handleJsonLoad(content);
        };
        reader.readAsText(file);
      } else {
        // Handle multiple files for merging
        const parsedFiles: ParsedFile[] = [];
        let filesProcessed = 0;

        Array.from(files).forEach(file => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            try {
              const parsedContent = JSON.parse(content) as Stage1JSON;
              // infer type and filmId simply
              let type: 'main' | 'asset' | 'unknown' = 'unknown';
              if (parsedContent.current_step === 'scenario_development' || (parsedContent.current_work as any)?.scenario) {
                type = 'main';
              } else if (parsedContent.current_step === 'asset_addition' || Object.keys(parsedContent.visual_blocks || {}).length > 0) {
                type = 'asset';
              }

              parsedFiles.push({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                content: content,
                parsed: parsedContent,
                type: type,
                filmId: parsedContent.film_id || 'UNKNOWN'
              });
            } catch (error) {
              console.error(`Error parsing file ${file.name}:`, error);
              alert(`파일 ${file.name}을(를) 파싱하는 데 실패했습니다.`);
            }
            filesProcessed++;
            if (filesProcessed === files.length) {
              if (parsedFiles.length > 0) {
                handleJsonLoad(parsedFiles);
              } else {
                alert('유효한 JSON 파일을 찾을 수 없습니다.');
              }
            }
          };
          reader.readAsText(file);
        });
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleJsonLoad]);

  // Download logic uses current jsonInput which is synchronized with merged result
  const handleDownload = useCallback(() => {
    if (!parsedJson) return;

    // Use jsonInput as the source of truth for download (it's the merged string)
    const jsonStr = formatJson(jsonInput);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Update filename to indicate merged status if applicable, or keep original ID
    a.download = `${parsedJson.film_id}_stage1_v1.1.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [parsedJson, jsonInput]);

  const handleViewChange = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const renderContent = () => {
    // Empty state
    if (currentView === 'empty' && !showEditor) {
      return <JsonInput onJsonLoad={handleJsonLoad} />;
    }

    // Show editor for syntax errors
    if (showEditor && validationResult && !validationResult.isValid) {
      return (
        <JsonEditor
          jsonInput={jsonInput}
          errors={validationResult.errors}
          onJsonUpdate={handleJsonUpdate}
          onValidate={handleJsonLoad}
        />
      );
    }

    // Show validation panel
    if (currentView === 'validation' && validationResult) {
      return <ValidationPanel result={validationResult} />;
    }

    // Show content views
    if (parsedJson) {
      const NotAvailable = ({ section }: { section: string }) => (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg">{section} 데이터가 없습니다.</p>
        </div>
      );

      switch (currentView) {
        case 'metadata':
          return <MetadataView data={parsedJson} />;
        case 'synopsis':
          return <SynopsisView data={parsedJson} />;
        case 'treatment':
          return parsedJson.current_work.treatment ? (
            <TreatmentView data={parsedJson} />
          ) : (
            <NotAvailable section="Treatment" />
          );
        case 'scenario':
          return parsedJson.current_work.scenario ? (
            <ScenarioView data={parsedJson} />
          ) : (
            <NotAvailable section="Scenario" />
          );
        case 'characters':
          return parsedJson.visual_blocks?.characters ? (
            <CharactersView data={parsedJson} />
          ) : (
            // Should not happen as navigation is disabled, but good fallback
            <NotAvailable section="Characters" />
          );
        case 'locations':
          return parsedJson.visual_blocks?.locations ? (
            <LocationsView data={parsedJson} />
          ) : (
            <NotAvailable section="Locations" />
          );
        case 'props':
          return parsedJson.visual_blocks?.props ? (
            <PropsView data={parsedJson} />
          ) : (
            <NotAvailable section="Props" />
          );
        default:
          return <MetadataView data={parsedJson} />;
      }
    }

    return <JsonInput onJsonLoad={handleJsonLoad} />;
  };

  const hasErrors = validationResult?.errors.some(e => e.severity === 'error') || false;
  const errorCount = validationResult?.errors.filter(e => e.severity === 'error').length || 0;

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
        multiple // Allow multiple file selection
      />

      {/* Header */}
      <Header
        hasJson={!!jsonInput}
        hasValidJson={!!parsedJson}
        onUpload={handleUpload}
        onReset={handleReset}
        onDownload={handleDownload}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - only show when we have parsed JSON or showing editor */}
        {(parsedJson || showEditor) && (
          <Sidebar
            currentView={currentView}
            data={parsedJson}
            hasErrors={hasErrors}
            errorCount={errorCount}
            onViewChange={handleViewChange}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-bg-primary">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
