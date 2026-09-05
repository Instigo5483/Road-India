export function prepareResolution(report, proof, now = new Date()) {
  if (!report || report.status === 'resolved') throw new Error('Report unavailable or already resolved')
  if (!Array.isArray(proof.photoUrls) || proof.photoUrls.length !== 1 ||
      typeof proof.photoUrls[0] !== 'string' || !proof.photoUrls[0].startsWith('data:image/') ||
      !proof.officer?.trim() || !proof.notes?.trim() || proof.certified !== true) {
    throw new Error('Complete the photo and sign-off fields')
  }
  const resolutionProof = {
    photoUrls: proof.photoUrls,
    officer: proof.officer.trim().slice(0, 100),
    workOrder: (proof.workOrder || '').trim().slice(0, 150),
    notes: proof.notes.trim().slice(0, 2000),
    certified: true,
    submittedAt: now.toISOString(),
  }
  if (new Blob([JSON.stringify({ ...report, resolutionProof })]).size > 980000) {
    throw new Error('Evidence exceeds document-size budget')
  }
  return { status: 'resolved', resolvedAt: now.toISOString(), resolutionProof }
}
