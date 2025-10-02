"use client"

import AWBForm from "@/app/_components/AWBForm";
import withAuth from "@/lib/withAuth";
import React from "react";

const CreateAWB = () => {
  return (
    <div className="">
      <AWBForm />
    </div>
  );
};

export default withAuth(CreateAWB);
