declare namespace JSX {
  interface IntrinsicElements {
    'sgds-masthead': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      fluid?: boolean;
    };
  }
}

// Declare the custom element for the DOM
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sgds-masthead': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        fluid?: boolean;
      };
    }
  }
} 