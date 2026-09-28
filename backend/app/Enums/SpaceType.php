<?php

namespace App\Enums;

enum SpaceType: string
{
    case HotDesk = 'hot_desk';
    case MeetingRoom = 'meeting_room';
    case PrivateOffice = 'private_office';
    case EventSpace = 'event_space';
}
