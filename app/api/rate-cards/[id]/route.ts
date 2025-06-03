import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
  } catch (error) {
    console.error('Error deleting rate card:', error);
    // Check if the error is due to the record not being found
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Rate card not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete rate card' }, { status: 500 });
  }
}
