/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ticket_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ticket_types_name_key" ON "ticket_types"("name");
