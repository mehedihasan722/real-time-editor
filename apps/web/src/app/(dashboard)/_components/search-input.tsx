"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/search-hooks";

const SearchInput = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") ?? "";
  const [value, setValue] = useState(currentSearch);
  const editing = useRef(false);
  const debounceValue = useDebounce(value, 500);

  useEffect(() => {
    editing.current = false;
    setValue(currentSearch);
  }, [currentSearch, pathname]);

  useEffect(() => {
    if (!editing.current || debounceValue === currentSearch) return;
    const params = new URLSearchParams(pathname === "/" ? searchParams.toString() : "");
    if (debounceValue) params.set("search", debounceValue);
    else params.delete("search");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/", { scroll: false });
  }, [debounceValue, currentSearch, pathname, router, searchParams]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    editing.current = true;
    setValue(event.target.value);
  };

  return <div className="w-full relative">
    <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
    <Input aria-label="Search boards" className="w-full max-w-[516px] pl-9" placeholder="Search boards" onChange={handleChange} value={value} />
  </div>;
};
export default SearchInput;
