const fs = require('fs');
const path = 'backend/agents/mainAgent.ts';

try {
  if (!fs.existsSync(path)) {
    console.error(`File not found: ${path}`);
    process.exit(1);
  }
  const content = fs.readFileSync(path, 'utf8');
  console.log(`File size: ${content.length}`);
  
  // Find function definition
  const regex = /function\s+createRedditTools/g;
  const match = regex.exec(content);
  
  if (match) {
    console.log(`Found createRedditTools at index: ${match.index}`);
    
    // Simple brace matching to extract the function
    let braces = 0;
    let startFound = false;
    let extracted = '';
    
    for (let i = match.index; i < content.length; i++) {
        const char = content[i];
        extracted += char;
        
        if (char === '{') {
            braces++;
            startFound = true;
        } else if (char === '}') {
            braces--;
        }
        
        if (startFound && braces === 0) {
            break;
        }
    }
    
    console.log('--- START ---');
    console.log(extracted);
    console.log('--- END ---');
    
    // Print line number estimation
    const linesBefore = content.substring(0, match.index).split('\n').length;
    console.log(`Estimated line number: ${linesBefore}`);
    
  } else {
    console.log('createRedditTools function not found in file');
    // Print lines around 2500 where it's called
    const lines = content.split('\n');
    console.log('Lines 2490-2510 context:');
    for(let i = 2490; i < 2510 && i < lines.length; i++) {
        console.log(`${i+1}: ${lines[i]}`);
    }
  }
} catch (error) {
  console.error(`Error reading file: ${error.message}`);
}
