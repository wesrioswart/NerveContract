declare module 'multer' {
  import { Request } from 'express';
  
  namespace multer {
    interface File {
      /** Name of the form field */
      fieldname: string;
      /** Name of the file on the uploader's computer */
      originalname: string;
      /** Value of the `Content-Type` header for this file */
      mimetype: string;
      /** Size of the file in bytes */
      size: number;
      /** `DiskStorage` directory to which the file has been saved */
      destination: string;
      /** Name of the file within `destination` */
      filename: string;
      /** Location of the uploaded file */
      path: string;
      /** A `Buffer` of the entire file */
      buffer: Buffer;
    }
    
    interface FileFilterCallback {
      (error: Error): void;
      (error: null, acceptFile: boolean): void;
    }
    
    interface StorageEngine {
      _handleFile(req: Request, file: Express.Multer.File, callback: (error?: any, info?: Partial<File>) => void): void;
      _removeFile(req: Request, file: Express.Multer.File, callback: (error: Error) => void): void;
    }
    
    interface DiskStorageOptions {
      /** A function that determines the destination path for uploaded files */
      destination?: string | ((req: Request, file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => void);
      /** A function that determines the name of the uploaded file */
      filename?: (req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => void;
    }
    
    interface Options {
      /** The destination directory for uploaded files */
      dest?: string;
      /** The storage engine to use for uploaded files */
      storage?: StorageEngine;
      /** An object specifying the size limits of the uploaded files */
      limits?: {
        /** Max field name size (in bytes) */
        fieldNameSize?: number;
        /** Max field value size (in bytes) */
        fieldSize?: number;
        /** Max number of non-file fields */
        fields?: number;
        /** Max file size (in bytes) */
        fileSize?: number;
        /** Max number of file fields */
        files?: number;
        /** Max number of parts (fields + files) */
        parts?: number;
        /** Max number of headers */
        headerPairs?: number;
      };
      /** Keep the full path of files instead of just the base name */
      preservePath?: boolean;
      /** A function to control which files are uploaded */
      fileFilter?: (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => void;
    }
    
    interface Instance {
      /** Accept a single file with the name fieldname. The single file will be stored in req.file. */
      single(fieldname: string): any;
      /** Accept an array of files, all with the name fieldname. Optionally error out if more than maxCount files are uploaded. The array of files will be stored in req.files. */
      array(fieldname: string, maxCount?: number): any;
      /** Accept a mix of files, specified by fields. An object with arrays of files will be stored in req.files. */
      fields(fields: Array<{ name: string; maxCount?: number }>): any;
      /** Accepts all files that comes over the wire. An array of files will be stored in req.files. */
      any(): any;
      /** Accept only specified mime types */
      none(): any;
    }
    
    function diskStorage(options: DiskStorageOptions): StorageEngine;
    function memoryStorage(): StorageEngine;
  }
  
  function multer(options?: multer.Options): multer.Instance;
  
  export = multer;
}

declare namespace Express {
  export interface Request {
    file?: Multer.File;
    files?: {
      [fieldname: string]: Multer.File[];
    } | Multer.File[];
  }
  
  namespace Multer {
    interface File {
      /** Name of the form field */
      fieldname: string;
      /** Name of the file on the uploader's computer */
      originalname: string;
      /** Value of the `Content-Type` header for this file */
      mimetype: string;
      /** Size of the file in bytes */
      size: number;
      /** `DiskStorage` directory to which the file has been saved */
      destination: string;
      /** Name of the file within `destination` */
      filename: string;
      /** Location of the uploaded file */
      path: string;
      /** A `Buffer` of the entire file */
      buffer: Buffer;
    }
  }
}