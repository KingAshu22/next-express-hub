"use client"

import AWBForm from "@/app/_components/AWBForm";
import withAuth from "@/lib/withAuth";
import React from "react";

const CreateAWB = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AWBForm />
    </div>
  );
};

export default withAuth(CreateAWB);
