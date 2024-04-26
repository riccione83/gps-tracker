import React, {
  JSXElementConstructor,
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { InjectReducer } from "./store";

export function withModule(reduxModule: any) {
  return <P, H>(WrappedComponent: JSXElementConstructor<P>) => {
    const moduleWrapper = function ModuleWrapper(props: P, ref: Ref<H>) {
      const componentRef = useRef<any>();
      useImperativeHandle(ref, () => componentRef.current);
      InjectReducer(reduxModule);
      return <WrappedComponent ref={componentRef} {...(props as any)} />;
    };
    moduleWrapper.displayName = `ModuleWrapper(${
      (WrappedComponent as any).displayName
    })`;
    return forwardRef<H, P>(moduleWrapper);
  };
}
