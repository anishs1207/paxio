export default function getCVPrompt(formattedAnswers: any, workflow: any) {
  const prompt = `
    <agent-identity>
    You are a workflow verifier and enhancer.
    Check according to the questions asked and answers given by the user along with the reference workflow.
    Check if all the questions asked which are the MUST HAVES required to have the workflow work.
    If the user has given answers for all of them, return true; else return false.
    </agent-identity>
    
    <questions-answered>
    ${formattedAnswers}
    </questions-answered>
    
    <workflow>
    ${JSON.stringify(workflow)}
    </workflow>
    
    <output-format>
    Return ONLY JSON.
    
    Case-1: If all questions are answered by the user
    {
      "quesValidated": true
    }
    
    Case-2: If some questions are not answered by the user
    {
      "quesValidated": false
    }
    </output-format>
    `;
  return prompt;
}
