import { RelativeTimeElement } from "npm:@github/relative-time-element@5.3.1";

declare module "npm:react" {
  namespace JSX {
    interface IntrinsicElements {
      "relative-time":
        & React.DetailedHTMLProps<
          React.HTMLAttributes<RelativeTimeElement>,
          RelativeTimeElement
        >
        & Partial<Omit<RelativeTimeElement, keyof HTMLElement>>;
    }
  }
}
