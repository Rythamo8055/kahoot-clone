
"use client";

import { useState } from "react";
import AppShell from "@/components/app-shell";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { generateQuiz } from "@/ai/flows/generate-quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Trash2, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Quiz } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export default function CreateQuizPage() {
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [{ question: "", options: ["", ""], answer: -1 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const handleAiGenerate = async () => {
    if (!aiTopic) {
      toast({ title: "Please enter a topic.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateQuiz({ topic: aiTopic });
      const quizData = JSON.parse(result.quiz);
      const parsedQuestions = z.array(questionSchema).safeParse(quizData);

      if (!parsedQuestions.success) {
        console.error("AI Validation Error:", parsedQuestions.error);
        throw new Error("AI returned data in an unexpected format.");
      }

      form.setValue("title", `Quiz on ${aiTopic}`);
      form.setValue("description", `An AI-generated quiz about ${aiTopic}.`);
      replace(parsedQuestions.data);

      toast({
        title: "Quiz generated successfully!",
        description: "Review and edit the questions below.",
      });
    } catch (error) {
      console.error("AI Generation Error:", error);
      toast({
        title: "AI Generation Failed",
        description: String(error) || "Could not generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const onSubmit = (data: QuizFormData) => {
    const newQuiz: Quiz = {
      id: new Date().getTime().toString(),
      ...data,
      questions: data.questions.map(q => ({...q, id: Math.random().toString()}))
    };
    
    const existingQuizzes: Quiz[] = JSON.parse(localStorage.getItem("quizzes") || "[]");
    localStorage.setItem("quizzes", JSON.stringify([...existingQuizzes, newQuiz]));

    toast({ title: "Quiz Saved!", description: "Your new quiz has been saved successfully." });
    router.push("/dashboard");
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="h-6 w-6 mr-3 text-primary" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">
                Generate with AI
              </span>
            </CardTitle>
            <CardDescription>
              Provide a topic, and we'll create a quiz for you. You can review and edit it before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="e.g., 'The Roman Empire' or 'JavaScript Fundamentals'"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleAiGenerate()}
              disabled={isGenerating}
            />
            <Button onClick={handleAiGenerate} disabled={isGenerating} className="w-full sm:w-auto">
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-pink-400 to-accent">Quiz Details</CardTitle>
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
                         {field.options.map((_, optionIndex) => (
                           <FormField key={optionIndex} control={form.control} name={`questions.${index}.options.${optionIndex}`} render={({ field }) => (
                              <FormItem><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                           )}/>
                         ))}
                      </div>
                    </div>
                    <FormField control={form.control} name={`questions.${index}.answer`} render={({ field }) => (
                      <FormItem><FormLabel>Correct Answer</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select the correct answer" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {form.getValues(`questions.${index}.options`).map((opt, optIndex) => (
                              <SelectItem key={optIndex} value={String(optIndex)}>{opt || `Option ${optIndex + 1}`}</SelectItem>
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
              <Button type="submit" size="lg">Save Quiz</Button>
            </div>
          </form>
        </Form>
      </div>
    </AppShell>
  );
}
