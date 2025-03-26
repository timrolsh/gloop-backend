import { ApiProperty } from "@nestjs/swagger";

export class AuthResponseDto {
    @ApiProperty({
        description: "Access token for authentication",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    })
    accessToken: string;

    @ApiProperty({
        description: "Refresh token for obtaining a new access token",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    })
    refreshToken: string;

    constructor(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}
