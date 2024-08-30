import Image from "next/image";
import React from "react";

const EmptyFavourites = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image src="/empty-favourites.svg" alt="Empty" height={200} width={200} />
      <h2 className="text-2xl font-semibold mt-6">No favourites board!</h2>
      <p className="text-muted-foreground text-sm mt-2">
        Try favouriting a board
      </p>
    </div>
  );
};

export default EmptyFavourites;
