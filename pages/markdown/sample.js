// ./editor.ts
import { useRef } from "react";
import dynamic from "next/dynamic";
const DynamicEditor = dynamic(() => import("../../component/Editor"), { ssr: false });

export default function FormEditor({ initialValue, onChange }) {
  

  return (
    <DynamicEditor onChange={() => {
        
    }}/>
  );
}