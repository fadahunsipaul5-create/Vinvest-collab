import React, { useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchProps {
  onSearch: (query: string) => void;
}

export function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSearch} className="relative w-full sm:w-80 md:w-96">
      <SearchIcon className="absolute left-2 sm:left-2.5 top-2 sm:top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search financial data..."
        className="w-full pl-6 sm:pl-8 pr-16 sm:pr-20 text-sm sm:text-base h-8 sm:h-9"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <Button type="submit" size="sm" className="absolute right-1 top-0.5 sm:top-1 h-6 sm:h-7 px-2 sm:px-3 text-xs sm:text-sm">
        Query
      </Button>
    </form>
  )
}

