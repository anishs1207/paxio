import { DynamicTool } from "langchain/tools";
import { docs, drive } from "./credential";

// Create a new Google Doc
const createDocument = new DynamicTool({
  name: "createDocument",
  description: `
Creates a brand-new Google Document in the user's Google Drive.
**Required Input (JSON only):**
- { "title": "string" } — Title of the new document.

**Behavior:**
- Always respond with a JSON object containing { success: boolean, documentId: string, title: string } on success.
- On error, return { error: string, details: string }.
`,
  func: async (input: string) => {
    try {
      const { title } = JSON.parse(input);
      const res = await docs.documents.create({ requestBody: { title } });
      return JSON.stringify({
        success: true,
        documentId: res.data.documentId,
        title,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to create document",
        details: (error as Error).message,
      });
    }
  },
});

// Read an existing Doc
const readDocument = new DynamicTool({
  name: "readDocument",
  description: `
Reads and extracts plain text content from a Google Document.

**Required Input (JSON only):**
- { "documentId": "string" }
    `,
  func: async (input: string) => {
    try {
      const { documentId } = JSON.parse(input);
      const res = await docs.documents.get({ documentId });
      const content =
        res.data.body?.content
          //@ts-ignore
          ?.map((c) =>
            //@ts-ignore
            c.paragraph?.elements?.map((e) => e.textRun?.content || "").join("")
          )
          .join("\n") || "";
      return JSON.stringify({ documentId, content });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to read document",
        details: (error as Error).message,
      });
    }
  },
});

// Append text at the end
const appendText = new DynamicTool({
  name: "appendText",
  description: `
Appends text to the end of an existing Google Document.

**Behavior:**
- Inserts the text at the last position of the document.
- Returns { success: true, message: "Text appended" } on success.
- On error, return { error: string, details: string }.

    `,
  func: async (input: string) => {
    try {
      const { documentId, text } = JSON.parse(input);
      const res = await docs.documents.get({ documentId });
      const endIndex = res.data.body?.content?.slice(-1)[0]?.endIndex || 1;
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: endIndex - 1 },
                text: `\n${text}`,
              },
            },
          ],
        },
      });
      return JSON.stringify({ success: true, message: "Text appended" });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to append text",
        details: (error as Error).message,
      });
    }
  },
});

// Insert or edit text at any position
const insertText = new DynamicTool({
  name: "insertText",
  description: `
Inserts text at a specific character index inside a Google Document.


**Behavior:**
- Index is the character offset in the document.
- Returns { success: true, message: "Inserted text at index X" }.
- On error, return { error: string, details: string }.
    `,
  func: async (input: string) => {
    try {
      const { documentId, index, text } = JSON.parse(input);
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [{ insertText: { location: { index }, text } }],
        },
      });
      return JSON.stringify({
        success: true,
        message: `Inserted text at index ${index}`,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to insert text",
        details: (error as Error).message,
      });
    }
  },
});

// Replace text
const replaceText = new DynamicTool({
  name: "replaceText",
  description: `
Replaces all occurrences of text inside a Google Document.


**Behavior:**
- Performs a global replace of exact matches.
- Case-sensitive (matchCase: true).
- Returns { success: true, message: "Replaced 'old' with 'new'" }.
- On error, return { error: string, details: string }.

    `,
  func: async (input: string) => {
    try {
      const { documentId, findText, replaceText: newText } = JSON.parse(input);
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              replaceAllText: {
                containsText: { text: findText, matchCase: true },
                replaceText: newText,
              },
            },
          ],
        },
      });
      return JSON.stringify({
        success: true,
        message: `Replaced '${findText}' with '${newText}'`,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to replace text",
        details: (error as Error).message,
      });
    }
  },
});

// Update document title
const updateTitle = new DynamicTool({
  name: "updateTitle",
  description: `
Updates the title (filename) of an existing Google Document.

**Behavior:**
- Changes the document's title in Google Drive.
- Returns { success: true, message: "Title updated to X" }.
- On error, return { error: string, details: string }.
    `,
  func: async (input: string) => {
    try {
      const { documentId, title } = JSON.parse(input);
      await drive.files.update({
        fileId: documentId,
        requestBody: { name: title },
      });
      return JSON.stringify({
        success: true,
        message: `Title updated to ${title}`,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to update title",
        details: (error as Error).message,
      });
    }
  },
});

// Delete a document
const deleteDocument = new DynamicTool({
  name: "deleteDocument",
  description: `
Permanently deletes a Google Document.


**Behavior:**
- Removes the file from Google Drive.
- Returns { success: true, message: "Document deleted" }.
- On error, return { error: string, details: string }.

    `,
  func: async (input: string) => {
    try {
      const { documentId } = JSON.parse(input);
      await drive.files.delete({ fileId: documentId });
      return JSON.stringify({ success: true, message: "Document deleted" });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to delete document",
        details: (error as Error).message,
      });
    }
  },
});

// Format text (bold, italic, heading)
const formatText = new DynamicTool({
  name: "formatText",
  description: `
Applies text formatting or styles to a specific range in a Google Document.

**Behavior:**
- startIndex and endIndex define the character range.
- Can apply bold, italic, or convert to a heading style (e.g., "HEADING_1").
- Returns { success: true, message: "Formatting applied" }.
- On error, return { error: string, details: string }.

    `,
  func: async (input: string) => {
    try {
      const { documentId, startIndex, endIndex, bold, italic, heading } =
        JSON.parse(input);
      const requests: any[] = [];
      if (bold !== undefined || italic !== undefined) {
        requests.push({
          updateTextStyle: {
            range: { startIndex, endIndex },
            textStyle: { bold, italic },
            fields: "bold,italic",
          },
        });
      }
      if (heading) {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex, endIndex },
            paragraphStyle: { namedStyleType: heading },
            fields: "namedStyleType",
          },
        });
      }
      await docs.documents.batchUpdate({
        documentId,
        requestBody: { requests },
      });
      return JSON.stringify({ success: true, message: "Formatting applied" });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to format text",
        details: (error as Error).message,
      });
    }
  },
});

// Search a document by its title/name
const searchDocument = new DynamicTool({
  name: "searchDocument",
  description: `
Searches the user's Google Drive for a Google Document by title.

**Required Input (JSON only):**
- { "title": "string" } — The (partial) name of the document to search for.

**Behavior:**
- Returns the best matching document's id and title.
- If multiple matches are found, returns the most recently modified one.
- On success: { success: true, documentId: string, title: string }
- On error or no match: { error: string, details: string }
`,
  func: async (input: string) => {
    try {
      const { title } = JSON.parse(input);

      const res = await drive.files.list({
        q: `name contains '${title}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
        fields: "files(id, name, modifiedTime)",
        orderBy: "modifiedTime desc",
        pageSize: 1,
      });

      const files = res.data.files || [];
      if (files.length === 0) {
        return JSON.stringify({
          error: "No document found",
          details: `No Google Docs file found with name containing '${title}'`,
        });
      }

      const file = files[0];
      return JSON.stringify({
        success: true,
        documentId: file.id,
        title: file.name,
      });
    } catch (error) {
      return JSON.stringify({
        error: "Failed to search for document",
        details: (error as Error).message,
      });
    }
  },
});

// Delete by Name
const deleteDocumentByName = new DynamicTool({
  name: "deleteDocumentByName",
  description: `
Deletes a Google Document by searching its name first.

**Required Input (JSON only):**
- { "title": "string" }

**Behavior:**
- Resolves the documentId using 'searchDocument'.
- If found, deletes the document.
- Returns { success: true, message: "Document deleted" }.
- On error, return { error: string, details: string }.
`,
  func: async (input: string) => {
    try {
      const { title } = JSON.parse(input);

      // Search first
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      // Delete using documentId
      return await deleteDocument.func(
        JSON.stringify({ documentId: searchRes.documentId })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to delete by name",
        details: (error as Error).message,
      });
    }
  },
});

// Read by Name
const readDocumentByName = new DynamicTool({
  name: "readDocumentByName",
  description: `
Reads the content of a Google Document by searching its name first.

**Required Input (JSON only):**
- { "title": "string" }

**Behavior:**
- Resolves the documentId using 'searchDocument'.
- Reads and returns the content.
`,
  func: async (input: string) => {
    try {
      const { title } = JSON.parse(input);

      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await readDocument.func(
        JSON.stringify({ documentId: searchRes.documentId })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to read by name",
        details: (error as Error).message,
      });
    }
  },
});

// Append by Name
const appendTextByName = new DynamicTool({
  name: "appendTextByName",
  description: `
Appends text to a Google Document by searching its name first.

**Required Input (JSON only):**
- { "title": "string", "text": "string" }
`,
  func: async (input: string) => {
    try {
      const { title, text } = JSON.parse(input);
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await appendText.func(
        JSON.stringify({ documentId: searchRes.documentId, text })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to append text by name",
        details: (error as Error).message,
      });
    }
  },
});

// Insert by Name
const insertTextByName = new DynamicTool({
  name: "insertTextByName",
  description: `
Inserts text into a Google Document at a specific index by searching its name first.

**Required Input (JSON only):**
- { "title": "string", "index": number, "text": "string" }
`,
  func: async (input: string) => {
    try {
      const { title, index, text } = JSON.parse(input);
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await insertText.func(
        JSON.stringify({ documentId: searchRes.documentId, index, text })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to insert text by name",
        details: (error as Error).message,
      });
    }
  },
});

// Replace by Name
const replaceTextByName = new DynamicTool({
  name: "replaceTextByName",
  description: `
Replaces text inside a Google Document by searching its name first.

**Required Input (JSON only):**
- { "title": "string", "findText": "string", "replaceText": "string" }
`,
  func: async (input: string) => {
    try {
      const { title, findText, replaceText: newText } = JSON.parse(input);
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await replaceText.func(
        JSON.stringify({
          documentId: searchRes.documentId,
          findText,
          replaceText: newText,
        })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to replace text by name",
        details: (error as Error).message,
      });
    }
  },
});

// Update Title by Name
const updateTitleByName = new DynamicTool({
  name: "updateTitleByName",
  description: `
Updates the title of a Google Document by searching its current name first.

**Required Input (JSON only):**
- { "title": "string", "newTitle": "string" }
`,
  func: async (input: string) => {
    try {
      const { title, newTitle } = JSON.parse(input);
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await updateTitle.func(
        JSON.stringify({ documentId: searchRes.documentId, title: newTitle })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to update title by name",
        details: (error as Error).message,
      });
    }
  },
});

// Format by Name
const formatTextByName = new DynamicTool({
  name: "formatTextByName",
  description: `
Formats a specific range of text inside a Google Document by searching its name first.

**Required Input (JSON only):**
- { "title": "string", "startIndex": number, "endIndex": number, "bold"?: boolean, "italic"?: boolean, "heading"?: string }
`,
  func: async (input: string) => {
    try {
      const { title, startIndex, endIndex, bold, italic, heading } =
        JSON.parse(input);
      const searchRes = JSON.parse(
        await searchDocument.func(JSON.stringify({ title }))
      );
      if (!searchRes.success) return JSON.stringify(searchRes);

      return await formatText.func(
        JSON.stringify({
          documentId: searchRes.documentId,
          startIndex,
          endIndex,
          bold,
          italic,
          heading,
        })
      );
    } catch (error) {
      return JSON.stringify({
        error: "Failed to format text by name",
        details: (error as Error).message,
      });
    }
  },
});

export {
  createDocument,
  readDocument,
  appendText,
  insertText,
  replaceText,
  updateTitle,
  deleteDocument,
  formatText,
  searchDocument,

  // byName wrappers
  deleteDocumentByName,
  readDocumentByName,
  appendTextByName,
  insertTextByName,
  replaceTextByName,
  updateTitleByName,
  formatTextByName,
};
