# 📁 Cấu Hình S3 File Service

## Tổng quan

Service này cho phép upload, download, và quản lý files trên Amazon S3, có thể dùng cho cả web và mobile app.

## 📋 Bước 1: Tạo S3 Bucket và IAM User

### 1.1. Tạo S3 Bucket

1. Đăng nhập vào AWS Console
2. Vào **S3** → **Create bucket**
3. Đặt tên bucket (ví dụ: `rental-app-files`)
4. Chọn region (ví dụ: `ap-southeast-1`)
5. **Quan trọng**: Chọn **Block all public access** nếu bạn muốn private files
   - Hoặc bỏ chọn nếu muốn public files
6. Click **Create bucket**

### 1.2. Tạo IAM User với S3 Permissions

1. Vào **IAM** → **Users** → **Create user**
2. Đặt tên: `rental-app-s3-user`
3. Chọn **Attach policies directly**
4. Tìm và chọn policy: `AmazonS3FullAccess` (hoặc tạo custom policy hạn chế hơn)
5. Click **Create user**
6. Vào **Security credentials** tab → **Create access key**
7. Chọn **Application running outside AWS**
8. ⚠️ **Copy và lưu lại**:
   - Access Key ID
   - Secret Access Key

### 1.3. Cấu hình Bucket Policy (nếu cần public access)

Nếu bucket là private, bạn cần tạo bucket policy để cho phép IAM user truy cập:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/rental-app-s3-user"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::rental-app-files",
        "arn:aws:s3:::rental-app-files/*"
      ]
    }
  ]
}
```

## 📋 Bước 2: Thêm Biến Môi Trường

### Local Development (.env)

Thêm vào file `backend/.env`:

```env
# AWS S3 Configuration
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=rental-app-files

# Optional: Custom base URL (nếu dùng CloudFront hoặc custom domain)
AWS_S3_BASE_URL=https://cdn.yourdomain.com
```

### Render.com Environment Variables

1. Vào Render Dashboard → Project → **Environment** tab
2. Thêm các biến:
   - `AWS_REGION` = `ap-southeast-1`
   - `AWS_ACCESS_KEY_ID` = (từ bước 1.2)
   - `AWS_SECRET_ACCESS_KEY` = (từ bước 1.2)
   - `AWS_S3_BUCKET_NAME` = `rental-app-files`
   - `AWS_S3_BASE_URL` = (optional, nếu có)

## 📋 Bước 3: API Endpoints

### Upload File (Single)

**POST** `/api/files/upload`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

```
file: [file binary]
folder: images (optional query param)
```

**Response:**

```json
{
  "success": true,
  "message": "Upload file thành công",
  "data": {
    "key": "images/abc123.jpg",
    "url": "https://rental-app-files.s3.ap-southeast-1.amazonaws.com/images/abc123.jpg",
    "size": 102400,
    "contentType": "image/jpeg"
  }
}
```

### Upload Multiple Files

**POST** `/api/files/upload-multiple`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**

```
files: [file1, file2, ...] (tối đa 10 files)
folder: images (optional query param)
```

### Get File Info

**GET** `/api/files/:key`

**Query Params:**

- `signed` (optional): `true` để lấy signed URL (cho private files)
- `expiresIn` (optional): Thời gian hết hạn của signed URL (giây), mặc định 3600

**Example:**

```
GET /api/files/images/abc123.jpg?signed=true&expiresIn=7200
```

### Download File

**GET** `/api/files/:key/download`

Trả về file stream.

### Delete File

**DELETE** `/api/files/:key`

**Headers:**

```
Authorization: Bearer <token>
```

## 📋 Bước 4: Sử dụng trong Code

### Upload từ Web (React/Next.js)

```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/files/upload?folder=images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.data.url; // URL của file đã upload
};
```

### Upload từ Mobile (React Native/Expo)

```typescript
import * as FileSystem from 'expo-file-system';

const uploadFile = async (uri: string, token: string) => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  const response = await fetch(`${API_URL}/files/upload?folder=images`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const result = await response.json();
  return result.data.url;
};
```

## 🔒 Security

- ✅ Tất cả endpoints yêu cầu JWT authentication
- ✅ Files được lưu với unique keys (UUID)
- ✅ Hỗ trợ signed URLs cho private files
- ✅ Có thể phân loại files theo folders

## 💡 Tips

1. **Folder structure**: Tổ chức files theo folders:
   - `images/` - Hình ảnh
   - `documents/` - Tài liệu
   - `kyc/` - KYC documents
   - `avatars/` - Avatar users

2. **Signed URLs**: Sử dụng signed URLs cho private files:

   ```typescript
   GET /api/files/private-file.jpg?signed=true&expiresIn=3600
   ```

3. **Custom Domain**: Cấu hình CloudFront hoặc custom domain để có URL đẹp hơn:

   ```
   AWS_S3_BASE_URL=https://cdn.yourdomain.com
   ```

4. **File Size Limits**: Thêm validation ở frontend để giới hạn kích thước file trước khi upload.

## 🐛 Troubleshooting

### Lỗi: "AWS S3 credentials chưa được cấu hình"

→ Kiểm tra các biến môi trường đã được set đúng chưa

### Lỗi: "Access Denied"

→ Kiểm tra IAM user có đúng permissions không
→ Kiểm tra bucket policy nếu bucket là private

### Files không public được truy cập

→ Kiểm tra bucket có được set public access không
→ Hoặc sử dụng signed URLs thay vì public URLs
