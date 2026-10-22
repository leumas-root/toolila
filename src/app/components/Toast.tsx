import * as React from "react";
import type { JSXElement } from "@fluentui/react-components";
import {
  useId,
  Link,
  Button,
  Toaster,
  useToastController,
  Toast,
  ToastTitle,
  ToastBody,
  ToastFooter,
} from "@fluentui/react-components";

export interface CallbackProps {
  message: string;
  intent?: "success" | "error" | "warning" | "info";
  footer?: () => JSXElement;
  title?: string;
}

interface ToastUiProps {
    notifyCallback?: React.RefObject<((c:CallbackProps) => void) | null>;
    toasterId: string;
}

export const ToastUi = ({notifyCallback, toasterId }: ToastUiProps): JSXElement => {
  const toasterName = useId(toasterId);
  const { dispatchToast } = useToastController(toasterName);
  const notify = (callbackProps: CallbackProps) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{callbackProps.title}</ToastTitle>
        <ToastBody>
          {callbackProps.message}
        </ToastBody>
        <ToastFooter>
          {callbackProps.footer && callbackProps.footer()}
        </ToastFooter>
      </Toast>,
      { intent: callbackProps.intent || "success" }
    );

    React.useEffect(() => {
      if (notifyCallback) {
        notifyCallback.current = notify;
      }
      return () => {
        if (!notifyCallback) return;
        notifyCallback.current = null;
      }
    }, [notifyCallback]);

  return (
    <>
      <Toaster toasterId={toasterName} />
    </>
  );
};