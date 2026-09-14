"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/search-hooks";

const SearchInput = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(currentSearch);
  const debounceValue = useDebounce(value, 500);

  useEffect(() => {
    setValue(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (debounceValue === currentSearch) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounceValue) params.set("search", debounceValue);
    else params.delete("search");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [debounceValue, currentSearch, pathname, router, searchParams]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

  return <div className="w-full relative">
    <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input className="w-full max-w-[516px] pl-9" placeholder="Search boards" onChange={handleChange} value={value} />
  </div>;
};
export default SearchInput;
