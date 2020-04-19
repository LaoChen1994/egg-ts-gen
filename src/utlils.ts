import * as prettier from "prettier";

const fs = require("fs");

const keyUtils = () => {
  const keyList: string[] = [];
  const letterList = Array.from({ length: 26 }).map((_, index) =>
    String.fromCharCode(index + 97)
  );

  const getKey = (): string => {
    const newName = Array.from({ length: 6 }).reduce((prev: string, curr) => {
      const i = Math.floor(26 * Math.random());
      return prev + letterList[i];
    }, "");

    if (keyList.includes(newName)) {
      return getKey();
    }

    keyList.push(newName);
    return newName;
  };

  return {
    getKey,
  };
};

// 下面这个要封装成一个函数最好
export function getTsFromObject(path: string) {
  class TsGen {
    interfaceCollection: string[];
    typeList: string[];
    keyUtils: ReturnType<typeof keyUtils>;
    path: string;

    constructor(outoput: string) {
      this.interfaceCollection = [];
      this.typeList = [];
      this.keyUtils = keyUtils();
      this.path = outoput;
    }

    public setNewPath = (path: string) => {
      this.path = path;
      return this;
    };

    public writeInterfaceToFile = (obj: any, name = "") => {
      const { getNewKey, getTsInterface } = this;
      const { path: _path } = this;
      const _obj = getTsInterface(obj);

      name = name ?? getNewKey();
      const interfacePrefix = `export interface I${
        name.slice(0).toUpperCase() + name.slice(1)
      }`;

      const res =
        this.interfaceCollection.reduce((p, c) => {
          p += c;
          return p;
        }, "") +
        interfacePrefix +
        _obj;

      fs.appendFileSync(_path, prettier.format(res, { parser: "typescript" }));
      this.clearInterfaceCollection();
      return this;
    };

    private getTypes = (item: any, key: string) => {
      let interfaceType: any = typeof item;
      const { typeList, interfaceCollection, getTsInterface } = this;

      if (interfaceType !== "object") {
      } else {
        const isArray = Array.isArray(item);
        const isNull = item === null;
        if (isNull) {
          interfaceType = null;
        }

        if (!isArray) {
          const typename = (interfaceType = `I${
            key[0].toUpperCase() + key.slice(1)
          }`);
          const subType = getTsInterface(item);
          interfaceCollection.push(`interface ${typename} ${subType}`);
        }
        if (isArray) {
          for (const elem of item) {
            const elemType = getTsInterface(elem);
            typeList.push(elemType);
          }

          const _final = [...new Set(typeList)];

          const arrayType = `${_final.length > 1 ? "(" : ""}${_final.join(
            "|"
          )}${_final.length > 1 ? ")" : ""}[]`;

          this.clearTypeList();

          interfaceType = arrayType;
        }
      }

      return {
        [key]: interfaceType,
      };
    };

    private getTsInterface = (obj: any) => {
      let _interface = {};
      const objTypes = typeof obj;
      const { getTypes } = this;

      if (objTypes !== "object") {
        return objTypes;
      }

      for (const key in obj) {
        const item = obj[key];
        _interface = { ..._interface, ...getTypes(item, key) };
      }

      let str = JSON.stringify(_interface)
        .replace(/\"/gi, "")
        .replace(",", ";");
      return str;
    };

    private getNewKey = () => {
      return this.keyUtils.getKey();
    };

    private clearInterfaceCollection = () => {
      this.interfaceCollection = [];
    };

    private clearTypeList = () => {
      this.typeList = [];
    };
  }

  return new TsGen(path);
}
