import { IS_PUBLIC_AUTH } from '@/constants/auth.constant';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata(IS_PUBLIC_AUTH, true);
