import { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
} from "@fluentui/react-components";

export function useDialogue() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function openDialogue(title: string, body: string) {
    setTitle(title);
    setBody(body);
    setOpen(true);
  }

  const dialogue = (
    <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>

          <DialogContent>{body}</DialogContent>

          <DialogActions>
            <Button
              appearance="primary"
              className="btn btn-danger"
              onClick={() => setOpen(false)}
            >
              Fermer
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );

  return { openDialogue, dialogue };
}