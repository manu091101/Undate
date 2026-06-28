import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { PhoneStartPayload } from './auth.types';

@Resolver()
export class AuthResolver {
  constructor(private readonly auth: AuthService) {}

  @Mutation(() => PhoneStartPayload)
  async startPhoneVerification(@Args('phoneE164') phoneE164: string): Promise<PhoneStartPayload> {
    const { requestId } = await this.auth.startPhoneVerification(phoneE164);
    return { requestId };
  }
}
