import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import Quill from "react-quill";
import "react-quill/dist/quill.snow.css";

const SAVE_INTERVAL_MS = 2000;

function App() {
  const [socket, setSocket] = useState();
  const [quill, setQuill] = useState();

  // Connect to backend socket server
  useEffect(() => {
    const s = io(process.env.REACT_APP_SERVER_URL);
    setSocket(s);

    return () => s.disconnect();
  }, []);

  // Load existing document on connect
  useEffect(() => {
    if (!socket || !quill) return;

    socket.once("load-document", document => {
      quill.setContents(document);
      quill.enable();
    });

    socket.emit("get-document", "document-1"); // Static doc ID for demo
  }, [socket, quill]);

  // Send user input changes to others
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };

    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket, quill]);

  // Receive other users' changes
  useEffect(() => {
    if (!socket || !quill) return;

    const handler = delta => {
      quill.updateContents(delta);
    };

    socket.on("receive-changes", handler);
    return () => socket.off("receive-changes", handler);
  }, [socket, quill]);

  // Auto save every 2 seconds
  useEffect(() => {
    if (!socket || !quill) return;

    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [socket, quill]);

  // Editor setup
  const wrapperRef = useCallback(wrapper => {
    if (wrapper == null) return;

    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);

    const q = new Quill(editor, { theme: "snow" });
    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  return <div className="container" ref={wrapperRef}></div>;
}

export default App;
