import type { Committee } from "@/lib/models/committee";
export type PublicCommittee = Pick<Committee, "id" | "name" | "slug" | "description" | "type" | "mandate" | "month" | "imageUrl"> & { chairName?: string };
export function publicCommittee(committee: Committee): PublicCommittee {
  const {id,name,slug,description,type,mandate,month,imageUrl} = committee;
  const chair = (committee.members??[]).find(member => member.isChairperson) ?? committee.members?.[0];
  return {id,name,slug,description,type,mandate,month,imageUrl,...(chair ? {chairName: chair.name} : {})};
}
