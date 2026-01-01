import { IsString } from 'class-validator';

export class UploadInvoiceDto {
  @IsString()
  invoiceFileId: string; // UserFile ID của invoice đã upload
}
