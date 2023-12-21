export const _parseInt = (node: Element, key: string, fallback: number): number => {
  return parseInt(node.getAttribute(key) || '' + fallback, 10);
}
export const _parseFloat = (node: Element, key: string, fallback: number): number => {
  return parseFloat(node.getAttribute(key) || '' + fallback);
}

export const _parseBool = (node: Element, key: string, fallback: boolean): boolean => {
  const val = node.getAttribute(key);
  if (val !== null) {
    return val.toLocaleLowerCase() === 'true';
  }
  return fallback;
}

const parser = new DOMParser();
export function readXML(path: string): Promise<Element> {
  return fetch(path).then(res => res.text()).then(text => parser.parseFromString(text, 'text/xml')).then(doc => {
    const ret = doc.children[0];
    return ret;
  });
}

export function xml_getChildNodeWithAttribute(node: Element, tagName: string, attributeN: string, attributeV?: string) {
  const query = `${tagName}[${attributeN}${attributeV ? '="' + attributeV + '"' : ''}]`;
  return node.querySelector(query);
}