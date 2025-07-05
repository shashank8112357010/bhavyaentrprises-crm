import { NextRequest, NextResponse } from 'next/server';
import { prismaWithReconnect as prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    await prisma.rateCard.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Rate card deleted successfully' }, { status: 200 });
  } catch (error:any) {
    console.error('Error deleting rate card:', error);
    // Check if the error is due to the record not being found
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Rate card not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete rate card' }, { status: 500 });
  }
}
