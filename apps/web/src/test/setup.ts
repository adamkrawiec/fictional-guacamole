// Adds DOM matchers like toBeInTheDocument() and toHaveTextContent() to Vitest's expect
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Unmount whatever a test rendered, so the next test starts with an empty page
afterEach(() => {
  cleanup();
});
