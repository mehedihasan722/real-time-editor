"use client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import qs from "query-string";

import { useRouter } from "next/navigation";
import React, { ChangeEvent, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/search-hooks";

const SearchInput = () => {
  const router = useRouter();
  const [value, setValue] = useState<string>("");

  // Use the custom useDebounce hook
  const debounceValue = useDebounce(value, 500);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  useEffect(() => {
    const url = qs.stringifyUrl(
      {
        url: "/",
        query: {
          search: debounceValue,
        },
      },
      { skipEmptyString: true, skipNull: true }
    );
    router.push(url);
  }, [debounceValue, router]);

  return (
    <div className="w-full relative">
      <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        className="w-full max-w-[516px] pl-9"
        placeholder="Search boards"
        onChange={handleChange}
        value={value}
      />
    </div>
  );
};

export default SearchInput;
