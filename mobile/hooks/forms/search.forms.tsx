import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  searchSchema,
  SearchInput,
} from "@/schemas/search.schema";

/**
 * Hook cho form tìm kiếm xe
 */
export function useSearchForm(defaultValues?: Partial<SearchInput>) {
  const form = useForm<SearchInput>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      location: defaultValues?.location || "TP. Hồ Chí Minh",
      startDate: defaultValues?.startDate || new Date(),
      endDate:
        defaultValues?.endDate ||
        new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    mode: "onChange",
  });

  return form;
}

