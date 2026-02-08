// apps/backend/src/agents/cross-verifier-agent/cv.validate.ts
import { PlannerWorkflow, PlannerStep } from "../../../../../types";
import getCVPrompt from "./cv.prompt";
import getParsedLLMJson from "./cv.jsonParse";

export interface AnsweredQuestion {
  question: string;
  answer: string;
  for: string[];
}

async function formatAnsweredQuestions(
  answers: AnsweredQuestion[]
): Promise<string> {
  console.log(answers);
  return answers
    .map((q, index) => {
      const qNum = index + 1;
      return `q${qNum}: ${q.question}\na${qNum}: ${q.answer}`;
    })
    .join("\n\n");
}

export default async function validateAnswersAndAddContext(
  answeredQuestions: AnsweredQuestion[],
  workflow: PlannerWorkflow
): Promise<PlannerWorkflow | false> {
  if (!Array.isArray(workflow) || workflow.length === 0) {
    console.error("Invalid workflow provided to CrossVerifier.");
    return false;
  }

  console.log("Answered Questions:", answeredQuestions);

  const formattedAnswers = await formatAnsweredQuestions(answeredQuestions);

  const prompt = getCVPrompt(formattedAnswers, workflow);

  let llmResponse: any = await getParsedLLMJson(prompt);

  if (!llmResponse.quesValidated) return false;

  const enrichedWorkflow: PlannerWorkflow = workflow.map(
    (step: PlannerStep) => {
      const nodeAnswers = answeredQuestions.filter((a) =>
        a.for.includes(step.node)
      );

      return {
        ...step,
        extraClarifiedInfo: nodeAnswers
          .map((a) => `${a.question} → ${a.answer}`)
          .join("\n"),
      };
    }
  );

  console.log("Enriched Workflow:", enrichedWorkflow);

  return enrichedWorkflow;
}
