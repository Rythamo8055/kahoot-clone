
"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/app-shell";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

const questionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "Must have at least two options"),
  answer: z.coerce.number().min(0, "Please select an answer"),
});

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z.array(questionSchema).min(1, "A quiz must have at least one question"),
});

type QuizFormData = z.infer<typeof quizSchema>;

export default function EditQuizPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!quizId || !user) return;

    const fetchQuizData = async () => {
      setIsLoading(true);
      try {
        const quizRef = doc(db, "quizzes", quizId);
        const quizSnap = await getDoc(quizRef);

        if (quizSnap.exists()) {
          const quizData = quizSnap.data();
          if (quizData.userId !== user.uid) {
            toast({ title: "Unauthorized", description: "You don't have permission to edit this quiz.", variant: "destructive" });
            router.push('/dashboard');
            return;
          }
          form.reset({
            title: quizData.title,
            description: quizData.description,
            questions: quizData.questions.map(({ question, options, answer }: any) => ({ question, options, answer })),
          });
        } else {
          toast({ title: "Not Found", description: "This quiz does not exist.", variant: "destructive" });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
        toast({ title: "Error", description: "Failed to load quiz data.", variant: "destructive" });
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId, user, authLoading, router, toast, form]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });
  
  const onSubmit = async (data: QuizFormData) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be signed in to save a quiz.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    
    const quizData = {
      title: data.title,
      description: data.description || "",
      questions: data.questions.map(q => ({...q, id: crypto.randomUUID()})),
    };
    
    try {
        const quizRef = doc(db, "quizzes", quizId);
        await updateDoc(quizRef, quizData);
        toast({ title: "Quiz Updated!", description: `"${data.title}" has been saved.` });
        router.push("/dashboard");
    } catch (error) {
        console.error("Error updating quiz: ", error);
        toast({
            title: "Failed to update quiz",
            description: "An error occurred while saving. Please try again.",
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  if (authLoading || isLoading || !user) {
    return (
        <AppShell>
            <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-48 w-full"/>
                <Skeleton className="h-64 w-full"/>
            </div>
        </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
                    <Edit className="h-6 w-6 text-primary"/>
                    Edit Quiz
                </CardTitle>
                <CardDescription>Update the details of your quiz below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="My Awesome Quiz" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A fun quiz about..." {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </CardContent>
            </Card>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">Questions</h2>
              {fields.map((field, index) => (
                <Card key={field.id} className="relative pt-6 bg-card/60 backdrop-blur-sm">
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => fields.length > 1 ? remove(index) : null}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name={`questions.${index}.question`} render={({ field }) => (
                      <FormItem><FormLabel>Question {index + 1}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <div>
                      <FormLabel>Options</FormLabel>
                      <div className="space-y-2 mt-2">
                         {form.getValues(`questions.${index}.options`).map((_, optionIndex) => (
                           <FormField key={optionIndex} control={form.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                            <FormItem>
                               <div className="flex items-center gap-4">
                                   <span className="flex h-10 w-10 items-center justify-center rounded-md bg-muted font-semibold">
                                       {String.fromCharCode(65 + optionIndex)}
                                   </span>
                                   <FormControl><Input {...field} /></FormControl>
                               </div>
                               <FormMessage className="ml-14" />
                           </FormItem>
                           )}/>
                         ))}
                      </div>
                    </div>
                    <FormField control={form.control} name={`questions.${index}.answer`} render={({ field }) => (
                      <FormItem><FormLabel>Correct Answer</FormLabel>
                        <Select onValueChange={field.onChange} value={String(field.value)} defaultValue={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select the correct answer" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {form.getValues(`questions.${index}.options`).map((opt, optIndex) => (
                              <SelectItem key={optIndex} value={String(optIndex)}>{`Option ${String.fromCharCode(65 + optIndex)}: ${opt.substring(0, 30)}...`}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      <FormMessage /></FormItem>
                    )}/>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ question: "", options: ["", ""], answer: -1 })}>
                <Plus className="mr-2 h-4 w-4" /> Add Question
              </Button>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AppShell>
  );
}
