import { Module } from '@nestjs/common';
import { ContactRequestController } from './contact-request.controller';
import { ContactRequestService } from './contact-request.service';

@Module({
  controllers: [ContactRequestController],
  providers: [ContactRequestService],
})
export class ContactRequestModule {}
