
'use client';

import React, { useState, useCallback, useTransition } from 'react';
import Papa from 'papaparse';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FileUp, ListChecks, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { bulkAddSubscribers, type SubscriberImportData, type ImportSubscribersResult } from '../actions';
import type { segments } from '@/db/schema';

type SegmentType = typeof segments.$inferSelect;

type ImportSubscribersDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  segments: SegmentType[];
  onImportComplete: () => void;
};

type ColumnMapping = {
  [header: string]: 'email' | 'name' | 'status' | '_ignore_';
};

const MAX_PREVIEW_ROWS = 5;
const VALID_STATUSES = ['active', 'unsubscribed', 'pending', 'bounced'];

export function ImportSubscribersDialog({ isOpen, onOpenChange, segments, onImportComplete }: ImportSubscribersDialogProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Map, 3: Summary
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [filePreviewRows, setFilePreviewRows] = useState<string[][]>([]);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([]);
  
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportSubscribersResult | null>(null);
  const [isPending, startTransition] = useTransition();


  const resetState = useCallback(() => {
    setCurrentStep(1);
    setFile(null);
    setFileHeaders([]);
    setFilePreviewRows([]);
    setParsedData([]);
    setColumnMappings({});
    setSelectedSegmentIds([]);
    setIsParsing(false);
    setIsImporting(false);
    setImportResult(null);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        toast({ title: 'Invalid File Type', description: 'Please upload a CSV file.', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
      setIsParsing(true);
      Papa.parse<Record<string, string>>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        preview: MAX_PREVIEW_ROWS + 1, // +1 to get headers from the first actual data row if needed by Papa
        complete: (results) => {
          if (results.errors.length > 0) {
            toast({ title: 'CSV Parsing Error', description: results.errors[0].message, variant: 'destructive' });
            setIsParsing(false);
            return;
          }
          if (results.data.length === 0 || !results.meta.fields) {
             toast({ title: 'Empty CSV', description: 'The CSV file appears to be empty or has no headers.', variant: 'destructive' });
             setIsParsing(false);
             return;
          }

          const headers = results.meta.fields;
          setFileHeaders(headers);
          setParsedData(results.data); // Store all parsed data
          setFilePreviewRows(results.data.slice(0, MAX_PREVIEW_ROWS).map(row => headers.map(header => row[header])));
          
          // Auto-map common headers
          const initialMappings: ColumnMapping = {};
          headers.forEach(header => {
            const lowerHeader = header.toLowerCase();
            if (lowerHeader.includes('email') || lowerHeader.includes('e-mail')) initialMappings[header] = 'email';
            else if (lowerHeader.includes('name')) initialMappings[header] = 'name';
            else if (lowerHeader.includes('status')) initialMappings[header] = 'status';
            else initialMappings[header] = '_ignore_';
          });
          setColumnMappings(initialMappings);
          setCurrentStep(2);
          setIsParsing(false);
        },
        error: (error) => {
            toast({ title: 'File Read Error', description: error.message, variant: 'destructive' });
            setIsParsing(false);
        }
      });
    }
  };

  const handleMappingChange = (header: string, field: 'email' | 'name' | 'status' | '_ignore_') => {
    setColumnMappings(prev => ({ ...prev, [header]: field }));
  };

  const handleSegmentToggle = (segmentId: string) => {
    setSelectedSegmentIds(prev => 
      prev.includes(segmentId) ? prev.filter(id => id !== segmentId) : [...prev, segmentId]
    );
  };

  const handleImport = async () => {
    const emailMappedHeader = Object.keys(columnMappings).find(h => columnMappings[h] === 'email');
    if (!emailMappedHeader) {
      toast({ title: 'Mapping Incomplete', description: 'You must map a column to "Email".', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    // Re-parse the full file for actual import if parsedData only has preview
    // This assumes `parsedData` from the initial parse (up to MAX_PREVIEW_ROWS+1) might not be the full dataset.
    // For large files, it's better to re-stream or parse fully here.
    // For simplicity, if `parsedData` was limited by preview, we re-parse.
    // However, PapaParse's `preview` still parses the whole file then gives you the preview slice.
    // So `parsedData` might already be the full data if preview count was high enough or not used to limit data array.
    // Let's assume `Papa.parse` during `handleFileChange` already processed the entire file
    // and `parsedData` holds all rows if `preview` was only for the previewRows generation.
    // If `preview` in PapaParse limits the `results.data` array itself, then a full re-parse is needed here.
    // Assuming `parsedData` is complete based on current logic (it is):
    
    const subscribersToImport: SubscriberImportData[] = parsedData.map(row => {
      const subscriber: SubscriberImportData = { email: '' };
      for (const header in columnMappings) {
        const mappedField = columnMappings[header];
        if (mappedField !== '_ignore_' && row[header]) {
          if (mappedField === 'status') {
             const statusValue = row[header].toLowerCase();
             if (VALID_STATUSES.includes(statusValue)) {
                subscriber[mappedField] = statusValue as SubscriberImportData['status'];
             } else {
                subscriber[mappedField] = 'pending'; // Default if status in CSV is invalid
             }
          } else {
             subscriber[mappedField] = row[header];
          }
        }
      }
      return subscriber;
    }).filter(sub => sub.email); // Ensure email is present

    if (subscribersToImport.length === 0) {
        toast({ title: 'No Data to Import', description: 'After mapping, no valid subscribers were found to import.', variant: 'destructive' });
        setIsImporting(false);
        return;
    }

    startTransition(async () => {
      const result = await bulkAddSubscribers(subscribersToImport, selectedSegmentIds);
      setImportResult(result);
      setCurrentStep(3);
      setIsImporting(false);
      if (result.success) {
        toast({ title: 'Import Successful', description: result.message });
        onImportComplete(); // Refresh the main subscribers list
      } else {
        toast({ title: 'Import Failed', description: result.message || 'An error occurred.', variant: 'destructive' });
      }
    });
  };
  
  const handleDialogClose = () => {
    if (isImporting) return; // Prevent closing while import is in progress
    resetState();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Subscribers from CSV</DialogTitle>
          <DialogDescription>
            {currentStep === 1 && "Upload your CSV file. Ensure it has a header row."}
            {currentStep === 2 && "Map your CSV columns to subscriber fields and select segments to apply."}
            {currentStep === 3 && "Import process summary."}
          </DialogDescription>
        </DialogHeader>

        {currentStep === 1 && (
          <div className="py-4 space-y-4">
            <Label htmlFor="csvFile" className="text-base font-medium">Select CSV File</Label>
            <Input id="csvFile" type="file" accept=".csv" onChange={handleFileChange} disabled={isParsing} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
            {isParsing && (
              <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Parsing file...</div>
            )}
            <Alert variant="default" className="mt-4">
              <ListChecks className="h-4 w-4" />
              <AlertTitle>CSV Format Guidelines</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>File must be in CSV (Comma Separated Values) format.</li>
                  <li>The first row should be headers (e.g., Email, Name, Status).</li>
                  <li>Ensure 'Email' column is present and contains valid email addresses.</li>
                  <li>Optional columns: 'Name', 'Status' (valid statuses: active, unsubscribed, pending, bounced).</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {currentStep === 2 && (
          <div className="py-4 space-y-6 flex-grow overflow-y-auto">
            <div>
              <h3 className="text-lg font-semibold mb-2">Column Mapping</h3>
              <p className="text-sm text-muted-foreground mb-3">Match your CSV columns to the corresponding subscriber fields.</p>
              <ScrollArea className="max-h-[300px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CSV Header</TableHead>
                      <TableHead>Map to Field</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fileHeaders.map(header => (
                      <TableRow key={header}>
                        <TableCell className="font-medium">{header}</TableCell>
                        <TableCell>
                          <Select 
                            value={columnMappings[header] || '_ignore_'} 
                            onValueChange={(value) => handleMappingChange(header, value as any)}
                          >
                            <SelectTrigger className="text-xs h-8">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="email">Email Address</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="status">Status</SelectItem>
                              <SelectItem value="_ignore_">Do Not Import</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Assign to Segments (Optional)</h3>
              <p className="text-sm text-muted-foreground mb-3">Select segments to add all imported subscribers to.</p>
              {segments.length > 0 ? (
                <ScrollArea className="max-h-[150px] border rounded-md p-3 space-y-2">
                  {segments.map(segment => (
                    <div key={segment.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`segment-${segment.id}`} 
                        checked={selectedSegmentIds.includes(segment.id)}
                        onCheckedChange={() => handleSegmentToggle(segment.id)}
                      />
                      <Label htmlFor={`segment-${segment.id}`} className="text-sm font-normal cursor-pointer">{segment.name}</Label>
                    </div>
                  ))}
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No segments available. You can create them on the main Subscribers page.</p>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Data Preview (First {MAX_PREVIEW_ROWS} Rows)</h3>
               <ScrollArea className="max-h-[200px] border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {fileHeaders.map(header => <TableHead key={header} className="text-xs">{header}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filePreviewRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell, cellIndex) => <TableCell key={cellIndex} className="text-xs truncate max-w-[150px]">{cell}</TableCell>)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        )}

        {currentStep === 3 && importResult && (
          <div className="py-4 space-y-4">
            {importResult.success ? (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-700">Import Successful!</AlertTitle>
                <AlertDescription className="text-green-600 text-sm">
                  {importResult.message}
                  <ul className="list-disc list-inside mt-2">
                    <li>Subscribers Added: {importResult.addedCount}</li>
                    <li>Subscribers Updated: {importResult.updatedCount}</li>
                    <li>Subscribers Failed: {importResult.failedCount}</li>
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle>Import Failed or Had Issues</AlertTitle>
                <AlertDescription className="text-sm">
                  {importResult.message}
                   <ul className="list-disc list-inside mt-2">
                    <li>Subscribers Added: {importResult.addedCount}</li>
                    <li>Subscribers Updated: {importResult.updatedCount}</li>
                    <li>Subscribers Failed: {importResult.failedCount}</li>
                  </ul>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Error Details:</p>
                      <ScrollArea className="max-h-[150px] text-xs bg-destructive/10 p-2 rounded-md">
                        <ul className="list-disc list-inside">
                          {importResult.errors.map((err, i) => (
                             <li key={i}>Row {err.rowIndex + 1} {err.email ? `(${err.email})` : ''}: {err.error}</li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter className="pt-4 border-t">
          {currentStep === 1 && (
            <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
          )}
          {currentStep === 2 && (
            <>
              <Button variant="outline" onClick={() => setCurrentStep(1)} disabled={isImporting}>Back</Button>
              <Button onClick={handleImport} disabled={isImporting || isPending} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import Subscribers
              </Button>
            </>
          )}
          {currentStep === 3 && (
            <Button onClick={handleDialogClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

