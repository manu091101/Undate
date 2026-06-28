import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class PhoneStartPayload {
  @Field()
  requestId!: string;
}
