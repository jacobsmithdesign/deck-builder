"use client";

import {
  Card,
  CardContainer,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function PrimarySecondaryAxis() {
  return (
    <div>
      <CardContainer className="h-96">
        <CardHeader>
          <CardTitle>Primary and Secondary Axis</CardTitle>
        </CardHeader>
        <CardContent className="h-full flex items-center justify-center">
          <p>
            This is where the Primary and Secondary Axis visualization will go.
          </p>
        </CardContent>
      </CardContainer>
    </div>
  );
}
