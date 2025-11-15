"use client";

import { bulkUploadUsersAction } from "@/app/(protected)/(org-admin)/users/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  X,
} from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

type BulkUploadUsersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Separate component that will be remounted with key prop
function BulkUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    bulkUploadUsersAction,
    undefined
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      setSelectedFile(file);
      // Update the file input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  // Trigger file input click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = `name,email,role
Michael Scott,michael.scott@example.com,USER
Dwight Schrute,dwight.schrute@example.com,USER
Pam Beasley,pam.beasley@example.com,USER
Jim Halpert,jim.halpert@example.com,USER
Angela Martin,angela.martin@example.com,USER`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-users-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Download Template */}
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 bg-muted/30">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Download className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Step 1: Download Template</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get the CSV template with the correct format. Required columns:{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                name
              </code>
              ,{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                email
              </code>
              ,{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                role
              </code>{" "}
              (USER only)
            </p>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={downloadTemplate}
              className="cursor-pointer"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <form ref={formRef} action={formAction} className="space-y-6">
        {/* General form error */}
        {state?.errors?._form && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{state.errors._form.join(", ")}</div>
          </div>
        )}

        {/* Parse errors */}
        {state?.errors?.parseErrors && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Validation Errors:
            </div>
            <ul className="list-disc list-inside space-y-1">
              {state.errors.parseErrors.map((error, idx) => (
                <li key={idx} className="text-xs ml-2">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 2: Upload File */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Step 2: Upload CSV File</h3>
            <span className="text-destructive">*</span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer
              ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                  : "border-muted-foreground/25 bg-muted/10 hover:border-muted-foreground/50"
              }
            `}
          >
            <Input
              ref={fileInputRef}
              id="csvFile"
              name="csvFile"
              type="file"
              accept=".csv"
              required
              disabled={isPending}
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              // Selected File Display
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-green-700 dark:text-green-300 flex items-center gap-2 justify-center">
                    <FileText className="h-4 w-4" />
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFile}
                    disabled={isPending}
                    className="cursor-pointer"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPending}
                    className="cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload & Process
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Empty State - Drag & Drop
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium mb-1">
                    {isDragging
                      ? "Drop your CSV file here"
                      : "Drag & drop your CSV file here"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">or</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBrowseClick}
                    disabled={isPending}
                    className="cursor-pointer"
                  >
                    Browse Files
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Accepts .csv files only • Max 100 users per upload
                </p>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Results Section */}
      {state?.results && (
        <div className="space-y-4 pt-4 border-t">
          {/* Success Message Banner */}
          {state.results.summary.successful > 0 &&
            state.results.summary.failed === 0 && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">All users added successfully!</p>
                  <p className="text-sm mt-1">
                    {state.results.summary.successful}{" "}
                    {state.results.summary.successful === 1
                      ? "user has"
                      : "users have"}{" "}
                    been added to your organization.
                  </p>
                </div>
              </div>
            )}

          {/* Partial Success Message */}
          {state.results.summary.successful > 0 &&
            state.results.summary.failed > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Partial success</p>
                  <p className="text-sm mt-1">
                    {state.results.summary.successful} users added,{" "}
                    {state.results.summary.failed} failed. Review errors below.
                  </p>
                </div>
              </div>
            )}

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-3xl font-bold mb-1">
                {state.results.summary.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Rows</p>
            </div>
            <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4 text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                {state.results.summary.successful}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Successful
              </p>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4 text-center">
              <p className="text-3xl font-bold text-destructive mb-1">
                {state.results.summary.failed}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                Failed
              </p>
            </div>
          </div>

          {/* Successful Users */}
          {state.results.successful.length > 0 && (
            <div className="rounded-lg border border-green-200 dark:border-green-900">
              <div className="p-4 border-b bg-green-50/50 dark:bg-green-950/20 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-sm text-green-700 dark:text-green-300">
                  Successfully Added Users ({state.results.successful.length})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.results.successful.map((item) => (
                      <TableRow key={item.row}>
                        <TableCell className="font-medium">
                          {item.row}
                        </TableCell>
                        <TableCell>{item.user.name}</TableCell>
                        <TableCell>{item.user.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Failed Users - Highlighted in Red */}
          {state.results.failed.length > 0 && (
            <div className="rounded-lg border-2 border-destructive">
              <div className="p-4 border-b bg-destructive/10 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <h4 className="font-semibold text-sm text-destructive">
                  Failed to Add Users ({state.results.failed.length})
                </h4>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {state.results.failed.map((item) => (
                      <TableRow
                        key={item.row}
                        className="bg-destructive/5 hover:bg-destructive/10"
                      >
                        <TableCell className="font-medium text-destructive">
                          {item.row}
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {item.email}
                        </TableCell>
                        <TableCell className="text-destructive text-sm">
                          {item.errors.join(", ")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BulkUploadUsersModal({
  open,
  onOpenChange,
}: BulkUploadUsersModalProps) {
  const [key, setKey] = useState(0);

  // Reset component when modal closes to clear previous results
  useEffect(() => {
    if (!open) {
      // Increment key to force component remount on next open
      setKey((prev) => prev + 1);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple users to your organization at
            once.
          </DialogDescription>
        </DialogHeader>

        {/* Key prop forces complete remount when incremented */}
        <BulkUploadForm key={key} />
      </DialogContent>
    </Dialog>
  );
}
