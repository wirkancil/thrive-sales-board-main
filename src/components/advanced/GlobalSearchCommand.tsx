import { useState, useEffect } from "react";
import { 
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Building2, 
  User, 
  Calendar, 
  FileText,
  Plus,
  BarChart3,
  ArrowRight
} from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GlobalSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalSearchCommand = ({ open, onOpenChange }: GlobalSearchCommandProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { results, loading, search } = useGlobalSearch();
  const navigate = useNavigate();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      search(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    
    // Navigate to the appropriate route based on result type
    switch (result.rtype) {
      case 'opportunity':
        navigate(`/opportunities/${result.rid}`);
        break;
      case 'organization':
        navigate(`/organizations/${result.rid}`);
        break;
      case 'contact':
        navigate(`/contacts/${result.rid}`);
        break;
      case 'activity':
        navigate(`/activities/${result.rid}`);
        break;
      default:
        toast.info(`Opening ${result.rtype}: ${result.title}`);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return BarChart3;
      case 'organization':
        return Building2;
      case 'contact':
        return User;
      case 'activity':
        return Calendar;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-blue-100 text-blue-700';
      case 'organization':
        return 'bg-green-100 text-green-700';
      case 'contact':
        return 'bg-purple-100 text-purple-700';
      case 'activity':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.rtype]) {
      acc[result.rtype] = [];
    }
    acc[result.rtype].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels = {
    opportunity: 'Opportunities',
    organization: 'Organizations', 
    contact: 'Contacts',
    activity: 'Activities'
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search opportunities, organizations, contacts..."
        value={searchQuery}
        onValueChange={setSearchQuery}
      />
      <CommandList>
        {!searchQuery && (
          <>
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => {
                onOpenChange(false);
                navigate('/manager/pipeline/new');
              }}>
                <Plus className="mr-2 h-4 w-4" />
                New Opportunity
              </CommandItem>
              <CommandItem onSelect={() => {
                onOpenChange(false);
                navigate('/reports');
              }}>
                <FileText className="mr-2 h-4 w-4" />
                Go to Reports
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Recent Searches">
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>Acme Corp opportunities</span>
                <Badge variant="secondary" className="ml-auto">3 results</Badge>
              </CommandItem>
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>High value deals</span>
                <Badge variant="secondary" className="ml-auto">12 results</Badge>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {loading && searchQuery && (
          <CommandEmpty>Searching...</CommandEmpty>
        )}

        {!loading && searchQuery && results.length === 0 && (
          <CommandEmpty>No results found for "{searchQuery}"</CommandEmpty>
        )}

        {Object.entries(groupedResults).map(([type, typeResults]) => (
          <CommandGroup key={type} heading={typeLabels[type as keyof typeof typeLabels] || type}>
            {typeResults.map((result) => {
              const Icon = getResultIcon(result.rtype);
              return (
                <CommandItem
                  key={result.rid}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-3 p-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{result.title}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getTypeColor(result.rtype)}`}
                      >
                        {result.rtype}
                      </Badge>
                    </div>
                    {result.owner_name && (
                      <div className="text-sm text-muted-foreground">
                        {result.owner_name}
                      </div>
                    )}
                    {result.body && (
                      <div className="text-sm text-muted-foreground truncate">
                        {result.body.substring(0, 120)}...
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>

      <div className="flex items-center border-t px-3 py-2 text-xs text-muted-foreground">
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">↑↓</span>
        </kbd>
        <span className="ml-1 mr-3">navigate</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">↵</span>
        </kbd>
        <span className="ml-1 mr-3">select</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">esc</span>
        </kbd>
        <span className="ml-1">close</span>
      </div>
    </CommandDialog>
  );
};

export default GlobalSearchCommand;