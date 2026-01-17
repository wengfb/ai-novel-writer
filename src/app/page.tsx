import { StudioLayout } from "@/components/layout/studio-layout";
import { StudioHeader } from "@/components/studio/studio-header";
import { TextEditor } from "@/components/editor/text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Home() {
  return (
    <StudioLayout>
      <div className="flex h-full flex-col">
        <StudioHeader />
        <ScrollArea className="flex-1">
           <div className="p-8 pb-32">
             <TextEditor />
           </div>
        </ScrollArea>
      </div>
    </StudioLayout>
  );
}