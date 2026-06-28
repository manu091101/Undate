import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  private guardProduction() {
    if (process.env.NODE_ENV === 'production') {
      // Until Twilio Verify (with Fraud Guard + country allow-list) is wired,
      // never let any flow through the auth surface in production. See SYNTHESIS.md
      // and SECURITY.md for the rollout sequence.
      throw new ServiceUnavailableException('auth_not_configured');
    }
  }

  async startPhoneVerification(phoneE164: string): Promise<{ requestId: string }> {
    this.guardProduction();
    this.log.log(`[dev-stub] OTP start for ${phoneE164.slice(0, 4)}…`);
    return { requestId: 'dev-stub-request-id' };
  }

  async verifyPhone(_phoneE164: string, _code: string): Promise<{ ok: boolean }> {
    this.guardProduction();
    return { ok: true };
  }
}
