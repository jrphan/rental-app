import API_ENDPOINTS from "./api.endpoints";
import { apiClient } from "@/lib/api";
import { UserFile } from "@/types/file.types";
import { getAuthCache } from "@/store/auth";
import {
  cacheDirectory,
  copyAsync,
  getInfoAsync,
} from "expo-file-system/legacy";

async function toUploadUri(uri: string, filename: string) {
  if (uri.startsWith("content://")) {
    const dest = `${cacheDirectory}${filename}`;
    await copyAsync({ from: uri, to: dest });
    return dest;
  }
  return uri;
}

export const fileApi = {
  async uploadFile(
    file: { uri: string; name: string; type: string },
    folder?: string
  ): Promise<UserFile> {
    console.log("[uploadFile] baseURL", process.env.EXPO_PUBLIC_API_URL);
    console.log("[uploadFile] input uri", file.uri);

    const uploadUri = await toUploadUri(file.uri, file.name);
    const info = await getInfoAsync(uploadUri);
    console.log("[uploadFile] uploadUri", uploadUri, "exists", info.exists);

    const formData = new FormData();
    // React Native FormData: dùng any để tránh lỗi type của web
    formData.append("file", {
      uri: uploadUri,
      name: file.name,
      type: file.type,
    } as any);
    if (folder) {
      formData.append("folder", folder);
    }

    return await uploadWithFetchSingle(formData);
  },

  async uploadMultipleFiles(
    files: { uri: string; name: string; type: string }[],
    folder?: string
  ): Promise<UserFile[]> {
    const uploadable = await Promise.all(
      files.map(async (file) => ({
        ...file,
        uri: await toUploadUri(file.uri, file.name),
      }))
    );

    uploadable.forEach(async (file) => {
      const info = await getInfoAsync(file.uri);
      console.log(
        "[uploadMultipleFiles] file",
        file.name,
        "uri",
        file.uri,
        "exists",
        info.exists
      );
    });

    const formData = new FormData();
    uploadable.forEach((file) => {
      formData.append("files", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);
    });
    if (folder) {
      formData.append("folder", folder);
    }

    return await uploadWithFetchMultiple(formData);
  },

  async listMyFiles(folder?: string): Promise<UserFile[]> {
    const url = folder
      ? `${API_ENDPOINTS.FILES.LIST_MY_FILES}?folder=${encodeURIComponent(
          folder
        )}`
      : API_ENDPOINTS.FILES.LIST_MY_FILES;

    const response = await apiClient.get<UserFile[]>(url);
    if (response.success && response.data) {
      return response.data as UserFile[];
    }
    throw new Error(response.message || "Lấy danh sách file thất bại");
  },

  async deleteFile(id: string): Promise<void> {
    const response = await apiClient.delete<null>(
      API_ENDPOINTS.FILES.DELETE_FILE.replace(":id", id)
    );
    if (!response.success) {
      throw new Error(response.message || "Xóa file thất bại");
    }
  },
};

async function uploadWithFetchSingle(formData: FormData): Promise<UserFile> {
  const auth = getAuthCache();
  const url = `${process.env.EXPO_PUBLIC_API_URL ?? ""}${
    API_ENDPOINTS.FILES.UPLOAD
  }`;
  const res = await fetch(url, {
    method: "POST",
    headers: auth?.token
      ? {
          Authorization: `Bearer ${auth.token}`,
        }
      : undefined,
    body: formData,
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error("Upload file thất bại (fetch parse)");
  }

  if (json?.success && json?.data && !Array.isArray(json.data)) {
    return json.data as UserFile;
  }
  throw new Error(json?.message || "Upload file thất bại (fetch)");
}

async function uploadWithFetchMultiple(
  formData: FormData
): Promise<UserFile[]> {
  const auth = getAuthCache();
  const url = `${process.env.EXPO_PUBLIC_API_URL ?? ""}${
    API_ENDPOINTS.FILES.UPLOAD_MULTIPLE
  }`;
  const res = await fetch(url, {
    method: "POST",
    headers: auth?.token
      ? {
          Authorization: `Bearer ${auth.token}`,
        }
      : undefined,
    body: formData,
  });

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new Error("Upload nhiều file thất bại (fetch parse)");
  }

  if (json?.success && json?.data && Array.isArray(json.data)) {
    return json.data as UserFile[];
  }
  throw new Error(json?.message || "Upload nhiều file thất bại (fetch)");
}
