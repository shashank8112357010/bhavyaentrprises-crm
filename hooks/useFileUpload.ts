import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTicketStore } from "@/store/ticketStore"; // Assuming path to ticketStore

export function useFileUpload(ticketId: string) {
  const { toast } = useToast();
  const { fetchTicketById } = useTicketStore(); // Changed from fetchTickets

  const [isUploadingJcr, setIsUploadingJcr] = useState(false);
  const [isUploadingPo, setIsUploadingPo] = useState(false);
  const jcrInputRef = useRef<HTMLInputElement>(null);
  const poInputRef = useRef<HTMLInputElement>(null);

  const handleJcrUploadClick = () => jcrInputRef.current?.click();
  const handlePoUploadClick = () => poInputRef.current?.click();

  const handleJcrFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingJcr(true);
    const formData = new FormData();
    formData.append("jcrFile", file);

    try {
      const response = await fetch(`/api/ticket/${ticketId}/upload-jcr`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "JCR Upload failed");
      }
      toast({
        title: "Success",
        description: "JCR file uploaded successfully.",
      });
      await fetchTicketById(ticketId); // Refresh specific ticket
    } catch (error: any) {
      toast({
        title: "Error uploading JCR file",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingJcr(false);
      if (jcrInputRef.current) {
        jcrInputRef.current.value = ""; // Reset file input
      }
    }
  };

  const handlePoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingPo(true);
    const formData = new FormData();
    formData.append("poFile", file);

    try {
      const response = await fetch(`/api/ticket/${ticketId}/upload-po`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "PO Upload failed");
      }
      toast({
        title: "Success",
        description: "PO file uploaded successfully.",
      });
      await fetchTicketById(ticketId); // Refresh specific ticket
    } catch (error: any) {
      toast({
        title: "Error uploading PO file",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingPo(false);
      if (poInputRef.current) {
        poInputRef.current.value = ""; // Reset file input
      }
    }
  };

  return {
    isUploadingJcr,
    isUploadingPo,
    handleJcrUploadClick,
    handlePoUploadClick,
    jcrInputRef,
    poInputRef,
    handleJcrFileChange,
    handlePoFileChange,
  };
}
