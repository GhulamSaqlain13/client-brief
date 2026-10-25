// Starting points per profession. Everything is a suggestion the user adds
// explicitly; nothing here becomes scope without review.
export type Template = {
  label: string;
  questions: string[];
  checklist: string[];
  exclusions: string[];
};
const common = {
  questions: [
    "What is the final deadline, and is it fixed or flexible?",
    "Who gives final approval on deliverables?",
    "How many revision rounds are included?",
  ],
  checklist: ["Signed agreement or accepted offer", "Main point of contact"],
};
export const templates: Record<string, Template> = {
  general: {
    label: "General",
    questions: common.questions,
    checklist: common.checklist,
    exclusions: ["Work not listed in the requirements"],
  },
  web: {
    label: "Web development",
    questions: [
      ...common.questions,
      "Which pages or features are required for launch?",
      "Who provides hosting and the domain?",
      "Which browsers and devices must be supported?",
      "Are there third-party services or APIs to integrate?",
    ],
    checklist: [
      ...common.checklist,
      "Hosting access",
      "Domain / DNS access",
      "Brand assets (logo, colors, fonts)",
      "Page copy and images",
      "API keys or service credentials (shared securely)",
    ],
    exclusions: [
      "Ongoing maintenance after launch",
      "Copywriting and stock images",
      "Hosting and domain fees",
    ],
  },
  design: {
    label: "Graphic / UI design",
    questions: [
      ...common.questions,
      "Which file formats do you need delivered?",
      "Do you have brand guidelines or examples you like?",
      "Will you need the editable source files?",
    ],
    checklist: [
      ...common.checklist,
      "Brand guidelines",
      "Reference examples",
      "Final text to include",
    ],
    exclusions: [
      "Source files unless agreed",
      "Printing costs",
      "Stock image or font licenses",
    ],
  },
  seo: {
    label: "SEO",
    questions: [
      ...common.questions,
      "Which keywords or pages matter most?",
      "How will results be measured and reported?",
      "Who will implement on-site changes?",
    ],
    checklist: [
      ...common.checklist,
      "Google Search Console access",
      "Analytics access",
      "CMS access",
      "Competitor list",
    ],
    exclusions: ["Guaranteed rankings", "Paid advertising", "Content writing"],
  },
  video: {
    label: "Video",
    questions: [
      ...common.questions,
      "What length, aspect ratio and resolution are needed?",
      "Who provides footage, music and voice-over?",
      "Are subtitles or multiple versions needed?",
    ],
    checklist: [
      ...common.checklist,
      "Raw footage",
      "Script or storyboard",
      "Music / voice-over files",
      "Logo and brand assets",
    ],
    exclusions: [
      "Music or stock footage licenses",
      "Additional formats or cut-downs",
      "Filming on location",
    ],
  },
  copywriting: {
    label: "Copywriting",
    questions: [
      ...common.questions,
      "Who is the audience and what tone should the copy use?",
      "What word count and how many pieces are needed?",
      "Who is responsible for publishing?",
    ],
    checklist: [
      ...common.checklist,
      "Brand voice guide",
      "Product / service details",
      "Keyword list (if SEO copy)",
    ],
    exclusions: ["Publishing and formatting in the CMS", "Images and design"],
  },
  marketing: {
    label: "Marketing",
    questions: [
      ...common.questions,
      "What is the campaign goal and how is success measured?",
      "What is the ad spend budget, separate from the fee?",
      "Which channels are in scope?",
    ],
    checklist: [
      ...common.checklist,
      "Ad account access",
      "Analytics access",
      "Brand assets",
      "Target audience details",
    ],
    exclusions: ["Ad spend", "Guaranteed results", "Content production"],
  },
};
export const templateIds = Object.keys(templates);
