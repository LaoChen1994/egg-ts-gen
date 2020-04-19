// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { getTsFromObject } from "./utlils";
import * as prettier from "prettier";

const getSelectionText: () => string = () => {
  const editor = vscode.window.activeTextEditor;
  const textList: string[] = editor?.document.getText()?.split("\n") ?? [];

  let selections = editor?.selections ?? ({} as vscode.Selection[]);

  let text: string = selections.reduce((p, c) => {
    const {
      start: { line: s_line, character: s_char },
      end: { line: e_line, character: e_char },
    } = c;

    p +=
      textList[s_line].slice(s_char) +
      textList.slice(s_line + 1, e_line).join("") +
      textList[e_line].slice(0, e_char);

    return p;
  }, "");

  if(text.endsWith(';')) {text = text.slice(0, text.length - 1);}
  return text;
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "tsgen" is now active!');
  const tsGen = getTsFromObject("");

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let backwards = vscode.commands.registerCommand(
    "tsgen.backwards",
    async () => {
      const selection = getSelectionText().replace(/\s/gi, "");
      const { fileName } = vscode.window.activeTextEditor?.document ?? {};

      if (fileName && selection) {
        try {
          const jsonText = prettier.format(selection, { parser: "json" });

          const obj = JSON.parse(jsonText);
          tsGen.setNewPath(fileName).writeInterfaceToFile(obj);

          await vscode.commands.executeCommand('editor.action.formatDocument');
          vscode.window.showInformationMessage("转换成功");
        } catch (error) {
          vscode.window.showErrorMessage(`转换失效，${error?.message ?? ""}`);
        }
      } else {
        vscode.window.showErrorMessage("未选择有效文本");
      }
    }
  );

  context.subscriptions.push(backwards);
}

// this method is called when your extension is deactivated
export function deactivate() {}
