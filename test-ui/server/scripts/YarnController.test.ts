import { describe, expect, it } from "vitest";
import { YarnController } from "./YarnController.ts";

describe("YarnController", () => {
  it("should parse multiple React versions from yarn list output", () => {
    const controller = new YarnController("");
    const exampleOutput = `{"type":"tree","data":{"type":"list","trees":[{"name":"react@18.3.1","children":[],"hint":null,"color":"bold","depth":0},{"name":"react-dom@18.3.1","children":[],"hint":null,"color":"bold","depth":0},{"name":"@testing-library/react@16.3.0","children":[],"hint":null,"color":"bold","depth":0},{"name":"@types/react@19.1.5","children":[],"hint":null,"color":"bold","depth":0},{"name":"@types/react-dom@19.1.5","children":[],"hint":null,"color":"bold","depth":0},{"name":"@vitejs/plugin-react@4.5.0","children":[],"hint":null,"color":"bold","depth":0},{"name":"eslint-plugin-react-hooks@5.2.0","children":[],"hint":null,"color":"bold","depth":0},{"name":"eslint-plugin-react-refresh@0.4.20","children":[],"hint":null,"color":"bold","depth":0},{"name":"@babel/plugin-transform-react-jsx-self@7.27.1","children":[],"hint":null,"color":null,"depth":0},{"name":"@babel/plugin-transform-react-jsx-source@7.27.1","children":[],"hint":null,"color":null,"depth":0},{"name":"pretty-format@27.5.1","children":[{"name":"react-is@17.0.2","children":[],"hint":null,"color":"bold","depth":0}],"hint":null,"color":null,"depth":0},{"name":"react-refresh@0.17.0","children":[],"hint":null,"color":null,"depth":0},{"name":"recharts@3.0.0-beta.1","children":[{"name":"react-dom@19.1.0","children":[],"hint":null,"color":"bold","depth":0},{"name":"react@19.1.0","children":[],"hint":null,"color":"bold","depth":0}],"hint":null,"color":null,"depth":0},{"name":"react-is@19.1.0","children":[],"hint":null,"color":null,"depth":0},{"name":"react-redux@9.2.0","children":[],"hint":null,"color":null,"depth":0},{"name":"react-smooth@4.0.4","children":[],"hint":null,"color":null,"depth":0},{"name":"prop-types@15.8.1","children":[{"name":"react-is@16.13.1","children":[],"hint":null,"color":"bold","depth":0}],"hint":null,"color":null,"depth":0},{"name":"react-transition-group@4.4.5","children":[],"hint":null,"color":null,"depth":0}]}}`;
    const actual = controller.parseYarnListOutput(exampleOutput, "react");
    const expected = new Set(["18.3.1", "19.1.0"]);

    // Convert sets to arrays for better comparison
    const actualArray = Array.from(actual).sort();
    const expectedArray = Array.from(expected).sort();
    expect(actualArray).toEqual(expectedArray);
  });
});
