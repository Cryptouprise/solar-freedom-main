import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const forms = [
  { page: "SolarLoanHelp", fields: ["lender", "problem"] },
  { page: "SolarLienRemoval", fields: ["lienType", "goal"] },
  { page: "SellingHouseWithSolar", fields: ["situation", "loanBalance"] },
];

function optionHandler(source: string) {
  const ast = ts.createSourceFile("form.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let handler: ts.Expression | undefined;
  function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "handleOption") {
      handler = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  if (!handler) throw new Error("Form option handler not found");
  return ts.transpileModule(`(${handler.getText(ast)})`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

describe.each(forms)("$page question progression", ({ page, fields }) => {
  const source = readFileSync(`client/src/pages/${page}.tsx`, "utf8");

  it("records both answers and advances the final question to the contact step", () => {
    let step = 0;
    let form: Record<string, string> = { name: "Existing Name", phone: "5551234567" };
    const steps = fields.map(field => ({ field }));
    const select = (field: string, value: string) => {
      // Recreate the rendered closure after each state update, using the production handler.
      const handler = runInNewContext(optionHandler(source), {
        step,
        steps,
        setStep: (update: (previous: number) => number) => { step = update(step); },
        setForm: (update: (previous: Record<string, string>) => Record<string, string>) => { form = update(form); },
      });
      handler(field, value);
    };

    select(fields[0], "First selection");
    expect(step).toBe(1);
    expect(form[fields[0]]).toBe("First selection");

    select(fields[1], "Final selection");
    expect(step).toBe(steps.length);
    expect(form).toEqual({
      name: "Existing Name",
      phone: "5551234567",
      [fields[0]]: "First selection",
      [fields[1]]: "Final selection",
    });
    expect(source).toContain("if (step < steps.length) {");
    expect(source).toContain("<form onSubmit={handleSubmit}>");
  });

  it("describes requested callback next steps without confirming an appointment", () => {
    expect(source).toContain("Review Requested");
    expect(source).toContain("request a callback time in the booking window");
    expect(source).toContain("A callback or appointment is not confirmed by this submission");
    expect(source).not.toContain("within minutes");
    expect(source).toContain("setTimeout(() => setBookingOpen(true), 1200)");
  });
});
