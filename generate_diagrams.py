import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import os
import textwrap

output_dir = os.path.join(os.path.dirname(__file__), 'docs', 'diagrams')
os.makedirs(output_dir, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════
#  1. CONCEPTUAL FRAMEWORK  (Input -> Process -> Output)
#     Redesigned to match the simpler, cleaner style from the reference image
# ═══════════════════════════════════════════════════════════════════
def draw_conceptual_framework():
    fig, ax = plt.subplots(1, 1, figsize=(20, 12))
    ax.set_xlim(0, 20)
    ax.set_ylim(0, 12)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    # Title
    ax.text(10, 11.4, 'AlertDavao System - Conceptual Framework', fontsize=20, fontweight='bold',
            ha='center', va='center', color='#1a1a2e')

    # ─── Column backgrounds (INPUT - PROCESS - OUTPUT) ───
    cols = [
        (0.5, 1.0, 5.5, 9.5, '#48b9e8', 'INPUT', '#ffffff'),
        (6.8, 1.0, 6.4, 9.5, '#fdc844', 'PROCESS', '#ffffff'),
        (14.0, 1.0, 5.5, 9.5, '#f5c868', 'OUTPUT', '#ffffff'),
    ]
    for x, y, w, h, color, label, lcolor in cols:
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", facecolor=color,
                               edgecolor='#333', linewidth=2.0, alpha=0.95)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h - 0.5, label, fontsize=16, fontweight='bold',
                ha='center', va='center', color=lcolor)

    # ─── Arrows between columns ───
    for sx, ex in [(6.0, 6.7), (13.2, 13.9)]:
        ax.annotate('', xy=(ex, 5.75), xytext=(sx, 5.75),
                    arrowprops=dict(arrowstyle='->', color='#333', lw=3, mutation_scale=20))

    # ─── Helper to draw a content box ───
    def draw_content_box(ax, x, y, w, h, icon, title, bullets, box_color, text_color='#1e293b'):
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.1",
                               facecolor=box_color, edgecolor='#555',
                               linewidth=1.5, alpha=0.95)
        ax.add_patch(rect)
        # Icon/emoji
        ax.text(x + 0.25, y + h - 0.35, icon, fontsize=14, va='center', ha='center')
        # Title
        ax.text(x + 0.6, y + h - 0.35, title, fontsize=10, fontweight='bold',
                va='center', ha='left', color=text_color)
        # Bullets
        line_h = 0.28
        for i, b in enumerate(bullets):
            ax.text(x + 0.3, y + h - 0.75 - i * line_h, '• ' + b, fontsize=8,
                    va='center', ha='left', color='#475569')

    # ═══ INPUT COLUMN ═══
    ix = 0.7
    iw = 5.1
    iy = 9.3

    draw_content_box(ax, ix, iy, iw, 2.0, '👥', 'User Data',
                     ['• Name, email, contact,', '  ID and OTP'],
                     '#ffffff', '#1e293b')
    iy -= 2.2

    draw_content_box(ax, ix, iy, iw, 2.3, '📋', 'Reports',
                     ['• Category, media,', '  description,', '  location'],
                     '#ffffff', '#1e293b')
    iy -= 2.5

    draw_content_box(ax, ix, iy, iw, 2.6, '👮', 'Law Enforcement',
                     ['• Verification', '  notes, status', '  updates, actions'],
                     '#ffffff', '#1e293b')

    # ═══ PROCESS COLUMN ═══
    px = 7.0
    pw = 6.0
    py = 9.3

    # Main tech stack
    draw_content_box(ax, px, py, pw, 1.6, '💻', 'Visual Studio Code',
                     ['IDE for development'],
                     '#ffffff', '#1e293b')
    py -= 1.75

    draw_content_box(ax, px, py, pw, 1.6, '🗄️', 'PostgreSQL Database',
                     ['Stores all system data'],
                     '#ffffff', '#1e293b')
    py -= 1.75

    draw_content_box(ax, px, py, pw, 1.6, '📱', 'React Native + Laravel',
                     ['Mobile App + Admin Panel'],
                     '#ffffff', '#1e293b')
    py -= 1.95

    # Tech stack icons/labels box
    tech_y = py - 0.1
    ax.add_patch(FancyBboxPatch((px, tech_y - 2.2), pw, 2.2, boxstyle="round,pad=0.1",
                 facecolor='#fff', edgecolor='#555', linewidth=1.5, alpha=0.95))
    ax.text(px + pw/2, tech_y - 0.3, 'AUTHENTICATION & SECURED COMPLAINT AND', fontsize=7,
            ha='center', va='center', color='#e65100', fontweight='bold')
    ax.text(px + pw/2, tech_y - 0.55, 'REPORT MANAGEMENT', fontsize=7,
            ha='center', va='center', color='#e65100', fontweight='bold')
    
    # Tech stack labels
    tech_line_y = tech_y - 1.0
    ax.text(px + 0.3, tech_line_y, 'HTML, CSS,', fontsize=7, ha='left', color='#d84315', fontweight='bold')
    ax.text(px + 0.3, tech_line_y - 0.25, 'Bootstrap', fontsize=7, ha='left', color='#d84315', fontweight='bold')
    
    ax.text(px + 1.8, tech_line_y, 'SARIMA', fontsize=7, ha='left', color='#7c3aed', fontweight='bold')
    ax.text(px + 1.8, tech_line_y - 0.25, 'Analysis', fontsize=7, ha='left', color='#7c3aed', fontweight='bold')
    
    ax.text(px + 3.2, tech_line_y, 'JS', fontsize=7, ha='left', color='#f59e0b', fontweight='bold')
    
    ax.text(px + 4.0, tech_line_y, 'Leaflet JS', fontsize=7, ha='left', color='#10b981', fontweight='bold')
    ax.text(px + 4.0, tech_line_y - 0.25, '(hotspot mapping)', fontsize=6, ha='left', color='#10b981', style='italic')

    # ═══ OUTPUT COLUMN ═══
    ox = 14.2
    ow = 5.1
    oy = 9.3

    draw_content_box(ax, ox, oy, ow, 2.0, '👤', 'User',
                     ['• Confirmations,', '  report updates'],
                     '#ffffff', '#1e293b')
    oy -= 2.2

    draw_content_box(ax, ox, oy, ow, 2.6, '👮', 'Police / Law Enforcement',
                     ['• Dashboards,', '  maps, analytics'],
                     '#ffffff', '#1e293b')
    oy -= 2.8

    draw_content_box(ax, ox, oy, ow, 2.6, '🚓', 'Patrol Officers',
                     ['• Dispatch alerts,', '  chat, status', '  tracking'],
                     '#ffffff', '#1e293b')
    oy -= 2.8

    draw_content_box(ax, ox, oy, ow, 1.3, '👨‍💼', 'Administrator',
                     ['• Analytics, heatmaps, summaries'],
                     '#ffffff', '#1e293b')

    plt.tight_layout(pad=0.4)
    path = os.path.join(output_dir, '1_conceptual_framework_updated.png')
    plt.savefig(path, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
#  2. ERD  —  Exact original tables + new/modified ones marked
# ═══════════════════════════════════════════════════════════════════
def draw_erd():
    fig, ax = plt.subplots(1, 1, figsize=(30, 24))
    ax.set_xlim(0, 30)
    ax.set_ylim(0, 24)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(15, 23.4, 'AlertDavao - Entity Relationship Diagram (Updated)', fontsize=22,
            fontweight='bold', ha='center', va='center', color='#1a1a2e')

    def draw_table(ax, x, y, name, fields, header_color, width=4.0,
                   pk_indices=None, fk_indices=None, updated_indices=None):
        if pk_indices is None: pk_indices = [0]
        if fk_indices is None: fk_indices = []
        if updated_indices is None: updated_indices = []
        row_h = 0.30
        pad = 0.15
        total_h = (len(fields) + 1) * row_h + pad
        # Shadow
        ax.add_patch(FancyBboxPatch((x+0.06, y-total_h+0.04), width, total_h,
                     boxstyle="round,pad=0.06", facecolor='#ccc', edgecolor='none', alpha=0.3))
        # Body
        ax.add_patch(FancyBboxPatch((x, y-total_h+0.1), width, total_h,
                     boxstyle="round,pad=0.06", facecolor='#fdfdfd', edgecolor='#78909c', linewidth=1.2))
        # Header
        ax.add_patch(FancyBboxPatch((x+0.02, y - row_h + 0.06), width-0.04, row_h + 0.12,
                     boxstyle="round,pad=0.04", facecolor=header_color, edgecolor=header_color, linewidth=0))
        ax.text(x + width/2, y + 0.01, name, fontsize=9.5, fontweight='bold', ha='center', va='center', color='white')

        for i, field in enumerate(fields):
            fy = y - (i+1)*row_h - 0.06
            is_updated = i in updated_indices
            if i in pk_indices:
                ax.text(x + 0.15, fy, 'PK', fontsize=6, va='center', color='#b71c1c', fontweight='bold',
                        bbox=dict(facecolor='#ffcdd2', edgecolor='none', pad=1.0, boxstyle='round,pad=0.15'))
                ax.text(x + 0.55, fy, field, fontsize=7.5, va='center', color='#b71c1c', fontweight='bold')
            elif i in fk_indices:
                ax.text(x + 0.15, fy, 'FK', fontsize=6, va='center', color='#0d47a1', fontweight='bold',
                        bbox=dict(facecolor='#bbdefb', edgecolor='none', pad=1.0, boxstyle='round,pad=0.15'))
                fc = '#c2410c' if is_updated else '#1565c0'
                ax.text(x + 0.55, fy, field, fontsize=7.5, va='center', color=fc,
                        fontweight='bold' if is_updated else 'normal')
                if is_updated:
                    ax.text(x + width - 0.15, fy, '*', fontsize=10, va='center', ha='right',
                            color='#dc2626', fontweight='bold')
            else:
                fc = '#c2410c' if is_updated else '#37474f'
                ax.text(x + 0.15, fy, field, fontsize=7.5, va='center', color=fc,
                        fontweight='bold' if is_updated else 'normal')
                if is_updated:
                    ax.text(x + width - 0.15, fy, '*', fontsize=10, va='center', ha='right',
                            color='#dc2626', fontweight='bold')

    def draw_group(ax, x, y, w, h, label, color, edge_color, is_new=False):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.15",
                     facecolor=color, edgecolor=edge_color,
                     linewidth=2.5 if is_new else 1.5, alpha=0.3,
                     linestyle='--' if is_new else '-'))
        suffix = '  [NEW]' if is_new else ''
        ax.text(x + w/2, y + h - 0.3, label + suffix, fontsize=13, fontweight='bold',
                ha='center', color=edge_color)

    # ══════════════════════════════════════════════════════
    #  GROUP 1: USER MANAGEMENT  (original + updated fields)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 0.2, 15.8, 9.0, 7.0, 'User Management', '#e3f2fd', '#1565c0')

    # users_public — ORIGINAL + 3 new fields marked
    draw_table(ax, 0.5, 22.1, 'users_public', [
        'id',                          # 0 PK
        'firstname',                   # 1
        'lastname',                    # 2
        'email',                       # 3
        'contact',                     # 4
        'password',                    # 5
        'email_verified_at',           # 6
        'user_role (enum)',            # 7 UPDATED
        'push_token',                  # 8 UPDATED
        'assigned_station_id',         # 9 FK UPDATED
        'created_at',                  # 10
        'updated_at',                  # 11
    ], '#1e88e5', width=4.0, pk_indices=[0], fk_indices=[9], updated_indices=[7, 8, 9])

    # user_admin — ORIGINAL
    draw_table(ax, 5.0, 22.1, 'user_admin', [
        'id',
        'firstname',
        'lastname',
        'email',
        'station_id',
        'password',
        'created_at',
    ], '#1e88e5', width=3.8, pk_indices=[0], fk_indices=[4])

    # roles — ORIGINAL
    draw_table(ax, 0.5, 17.3, 'roles', [
        'role_id',
        'role_name',
    ], '#42a5f5', width=3.0, pk_indices=[0])

    # user_admin_roles — ORIGINAL
    draw_table(ax, 4.0, 17.3, 'user_admin_roles', [
        'id',
        'user_admin_id',
        'role_id',
    ], '#42a5f5', width=3.8, pk_indices=[0], fk_indices=[1, 2])

    # ══════════════════════════════════════════════════════
    #  GROUP 2: REPORTS  (original, dispatch_requests removed)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 9.8, 15.8, 9.5, 7.0, 'Reports', '#fce4ec', '#c62828')

    # reports — ORIGINAL + 2 new fields
    draw_table(ax, 10.0, 22.1, 'reports', [
        'report_id',                   # 0 PK
        'user_id',                     # 1 FK
        'category',                    # 2
        'description',                 # 3
        'location_id',                 # 4 FK
        'status (enum)',               # 5
        'assigned_station_id',         # 6 FK
        'is_valid (enum)',             # 7 UPDATED
        'validated_at',                # 8 UPDATED
        'created_at',                  # 9
        'updated_at',                  # 10
    ], '#e53935', width=4.2, pk_indices=[0], fk_indices=[1, 4, 6], updated_indices=[7, 8])

    # report_media — ORIGINAL
    draw_table(ax, 14.7, 22.1, 'report_media', [
        'media_id',
        'report_id',
        'media_url',
        'media_type',
    ], '#ef5350', width=3.8, pk_indices=[0], fk_indices=[1])

    # report_ip_tracking — ORIGINAL
    draw_table(ax, 14.7, 19.5, 'report_ip_tracking', [
        'id',
        'report_id',
        'ip_address',
        'created_at',
    ], '#ef5350', width=3.8, pk_indices=[0], fk_indices=[1])

    # dispatch_requests — REMOVED (strikethrough effect)
    draw_table(ax, 10.0, 17.7, 'dispatch_requests  [REMOVED]', [
        'id',
        'report_id',
        'officer_id',
        'status',
    ], '#bdbdbd', width=4.2, pk_indices=[0], fk_indices=[1, 2])
    # Draw X over it
    ax.plot([10.0, 14.2], [17.7, 16.1], color='#ef5350', linewidth=2.5, alpha=0.6)
    ax.plot([10.0, 14.2], [16.1, 17.7], color='#ef5350', linewidth=2.5, alpha=0.6)

    # ══════════════════════════════════════════════════════
    #  GROUP 3: LOCATION & GEOGRAPHY  (original)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 19.9, 15.8, 9.8, 7.0, 'Location & Geography', '#e8f5e9', '#2e7d32')

    draw_table(ax, 20.1, 22.1, 'locations', [
        'location_id',
        'barangay_id',
        'latitude',
        'longitude',
    ], '#43a047', width=3.6, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 24.1, 22.1, 'barangays', [
        'barangay_id',
        'name',
        'city',
    ], '#43a047', width=3.6, pk_indices=[0])

    draw_table(ax, 20.1, 19.5, 'police_stations', [
        'station_id',
        'name',
        'location',
        'contact',
    ], '#66bb6a', width=3.6, pk_indices=[0])

    draw_table(ax, 24.1, 19.5, 'boundary_polygons', [
        'id',
        'station_id',
        'coordinates',
    ], '#66bb6a', width=3.6, pk_indices=[0], fk_indices=[1])

    # NOTE: patrol_officer table was removed - patrol officers are now
    # regular users_public entries with user_role='patrol_officer'
    ax.text(24.1, 17.5, '📝 Patrol Officers = users_public', fontsize=8.5, va='center',
            color='#43a047', fontweight='bold', style='italic')
    ax.text(24.1, 17.0, '    where user_role = \'patrol_officer\'', fontsize=7.5, va='center',
            color='#666', style='italic')

    # ══════════════════════════════════════════════════════
    #  GROUP 4: DISPATCH  [NEW]
    # ══════════════════════════════════════════════════════
    draw_group(ax, 0.2, 7.8, 9.0, 7.5, 'Dispatch', '#fff3e0', '#e65100', is_new=True)

    draw_table(ax, 0.5, 14.6, 'patrol_dispatches  [NEW]', [
        'dispatch_id',                 # 0 PK
        'report_id',                   # 1 FK
        'station_id',                  # 2 FK
        'patrol_officer_id (nullable)',# 3 FK
        'status (enum)',               # 4
        'dispatched_by',               # 5 FK
        'notes',                       # 6
        'dispatched_at',               # 7
        'accepted_at',                 # 8
        'en_route_at',                 # 9
        'arrived_at',                  # 10
        'completed_at',                # 11
        'acceptance_time',             # 12
        'response_time',               # 13
        'completion_time',             # 14
        'three_minute_rule_met',       # 15
        'is_valid',                    # 16
        'validation_notes',            # 17
        'validated_at',                # 18
        'created_at',                  # 19
        'updated_at',                  # 20
    ], '#e65100', width=8.5, pk_indices=[0], fk_indices=[1, 2, 3, 5])

    # ══════════════════════════════════════════════════════
    #  GROUP 5: COMMUNICATION  (original + updated field)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 9.8, 7.8, 9.5, 7.5, 'Communication', '#f3e5f5', '#7b1fa2')

    # messages — ORIGINAL + is_read field
    draw_table(ax, 10.0, 14.6, 'messages', [
        'message_id',                  # 0 PK
        'sender_id',                   # 1 FK
        'receiver_id',                 # 2 FK
        'message',                     # 3
        'is_read (boolean)',           # 4 UPDATED
        'sent_at',                     # 5
    ], '#8e24aa', width=4.2, pk_indices=[0], fk_indices=[1, 2], updated_indices=[4])

    # notifications — ORIGINAL
    draw_table(ax, 14.7, 14.6, 'notifications', [
        'id',
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'report_id',
        'created_at',
    ], '#8e24aa', width=4.0, pk_indices=[0], fk_indices=[1, 6])

    # notification_reads — ORIGINAL
    draw_table(ax, 10.0, 11.2, 'notification_reads', [
        'id',
        'user_id',
        'notification_id',
    ], '#ab47bc', width=4.2, pk_indices=[0], fk_indices=[1, 2])

    # ══════════════════════════════════════════════════════
    #  GROUP 6: VERIFICATION  (original)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 19.9, 7.8, 9.8, 7.5, 'Verification', '#e0f7fa', '#00838f')

    draw_table(ax, 20.1, 14.6, 'verifications', [
        'id',
        'user_id',
        'id_type',
        'id_picture',
        'selfie',
        'status',
        'created_at',
    ], '#00897b', width=3.6, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 24.1, 14.6, 'verified_phones', [
        'id',
        'phone',
        'verified',
        'created_at',
    ], '#00897b', width=3.6, pk_indices=[0])

    draw_table(ax, 20.1, 11.2, 'otp_codes', [
        'id',
        'phone',
        'otp_hash',
        'purpose',
        'expires_at',
    ], '#26a69a', width=3.6, pk_indices=[0])

    # ══════════════════════════════════════════════════════
    #  GROUP 7: MODERATION  (original)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 0.2, 1.3, 9.0, 6.0, 'Moderation', '#fbe9e7', '#bf360c')

    draw_table(ax, 0.5, 6.6, 'user_flags', [
        'id',
        'user_id',
        'flag_count',
        'reason',
        'created_at',
    ], '#d84315', width=4.0, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 5.0, 6.6, 'user_restrictions', [
        'id',
        'user_id',
        'restriction_type',
        'reason',
        'expires_at',
        'created_at',
    ], '#d84315', width=3.8, pk_indices=[0], fk_indices=[1])

    # ══════════════════════════════════════════════════════
    #  GROUP 8: ANALYTICS  (original)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 9.8, 1.3, 9.5, 6.0, 'Analytics', '#ede7f6', '#4527a0')

    draw_table(ax, 10.0, 6.6, 'crime_analytics', [
        'analytics_id',
        'barangay_id',
        'category',
        'count',
        'period',
        'crime_rate',
    ], '#5e35b1', width=4.2, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 14.7, 6.6, 'crime_forecasts', [
        'forecast_id',
        'barangay_id',
        'category',
        'predicted_count',
        'forecast_date',
    ], '#5e35b1', width=4.0, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 10.0, 3.5, 'crime_rose', [
        'id',
        'barangay',
        'category',
        'count',
    ], '#7e57c2', width=4.2, pk_indices=[0])

    # ══════════════════════════════════════════════════════
    #  GROUP 9: SYSTEM & PERMISSIONS  (original)
    # ══════════════════════════════════════════════════════
    draw_group(ax, 19.9, 1.3, 9.8, 6.0, 'System & Permissions', '#eceff1', '#37474f')

    draw_table(ax, 20.1, 6.6, 'routes', [
        'id',
        'route_name',
    ], '#546e7a', width=3.4, pk_indices=[0])

    draw_table(ax, 24.1, 6.6, 'role_route', [
        'id',
        'role_id',
        'route_id',
    ], '#546e7a', width=3.4, pk_indices=[0], fk_indices=[1, 2])

    draw_table(ax, 20.1, 4.5, 'admin_actions', [
        'id',
        'admin_id',
        'action',
    ], '#78909c', width=3.4, pk_indices=[0], fk_indices=[1])

    draw_table(ax, 24.1, 4.5, 'failed_jobs', [
        'id',
        'uuid',
        'payload',
        'failed_at',
    ], '#78909c', width=3.4, pk_indices=[0])

    draw_table(ax, 20.1, 2.6, 'personal_access_tokens', [
        'id',
        'tokenable_type',
        'token',
    ], '#90a4ae', width=3.4, pk_indices=[0])

    draw_table(ax, 24.1, 2.6, 'password_reset_tokens', [
        'email',
        'token',
        'created_at',
    ], '#90a4ae', width=3.4, pk_indices=[0])

    # ─── LEGEND ───
    ax.add_patch(FancyBboxPatch((0.5, 0.15), 29, 1.0, boxstyle="round,pad=0.1",
                 facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1))
    lx = 1.0
    ly = 0.85
    ax.text(lx, ly, 'PK', fontsize=7, va='center', color='#b71c1c', fontweight='bold',
            bbox=dict(facecolor='#ffcdd2', edgecolor='none', pad=1.5, boxstyle='round,pad=0.15'))
    ax.text(lx+0.65, ly, '= Primary Key', fontsize=8.5, va='center', color='#555')
    ax.text(lx+3.3, ly, 'FK', fontsize=7, va='center', color='#0d47a1', fontweight='bold',
            bbox=dict(facecolor='#bbdefb', edgecolor='none', pad=1.5, boxstyle='round,pad=0.15'))
    ax.text(lx+3.95, ly, '= Foreign Key', fontsize=8.5, va='center', color='#555')
    ax.text(lx+7.2, ly, '*', fontsize=12, va='center', color='#dc2626', fontweight='bold')
    ax.text(lx+7.7, ly, '= New/Updated field', fontsize=8.5, va='center', color='#555')
    ax.text(lx+11.5, ly, '[NEW]', fontsize=8.5, va='center', color='#e65100', fontweight='bold')
    ax.text(lx+12.8, ly, '= New table/group', fontsize=8.5, va='center', color='#555')
    ax.text(lx+16.5, ly, '[REMOVED]', fontsize=8.5, va='center', color='#bdbdbd', fontweight='bold')
    ax.text(lx+18.5, ly, '= Deprecated table', fontsize=8.5, va='center', color='#555')

    ly2 = 0.4
    ax.text(lx, ly2, 'patrol_dispatches.status enum:  pending > accepted > en_route > arrived > completed',
            fontsize=8, va='center', color='#666', style='italic')
    ax.text(lx+16, ly2, 'patrol_officer_id is NULLABLE (broadcast model - NULL until officer accepts)',
            fontsize=8, va='center', color='#666', style='italic')

    plt.tight_layout(pad=0.3)
    path = os.path.join(output_dir, '2_erd_updated.png')
    plt.savefig(path, dpi=180, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
#  3. USE CASE DIAGRAM
#
#  ORIGINAL actors: Citizen, Central Admin, Local Officer
#  ORIGINAL use cases kept. NEW actor (Patrol Officer) and NEW
#  use cases added. Modified ones noted.
# ═══════════════════════════════════════════════════════════════════
def draw_use_case():
    fig, ax = plt.subplots(1, 1, figsize=(26, 20))
    ax.set_xlim(0, 26)
    ax.set_ylim(0, 20)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(13, 19.4, 'AlertDavao - Use Case Diagram (Updated)', fontsize=22,
            fontweight='bold', ha='center', va='center', color='#1a1a2e')

    # System boundary
    ax.add_patch(FancyBboxPatch((4.5, 0.8), 17, 18.0, boxstyle="round,pad=0.25",
                 facecolor='#fafbfc', edgecolor='#334155', linewidth=2.5, linestyle='--'))
    ax.text(13, 18.5, 'AlertDavao System', fontsize=15, fontweight='bold', ha='center',
            color='#334155', style='italic')

    # ─── Actor Drawing ───
    def draw_actor(ax, x, y, label, color='#1a1a2e', is_new=False):
        r = 0.26
        ax.add_patch(plt.Circle((x, y + 0.8), r, fill=True, facecolor=color, edgecolor=color, linewidth=2.2))
        ax.plot([x, x], [y + 0.54, y - 0.1], color=color, linewidth=2.5)
        ax.plot([x - 0.42, x, x + 0.42], [y + 0.38, y + 0.18, y + 0.38], color=color, linewidth=2.2)
        ax.plot([x - 0.38, x, x + 0.38], [y - 0.58, y - 0.1, y - 0.58], color=color, linewidth=2.2)
        ax.text(x, y - 0.95, label, fontsize=11.5, fontweight='bold', ha='center', color=color)
        if is_new:
            ax.text(x, y - 1.3, '[NEW ACTOR]', fontsize=8, fontweight='bold', ha='center', color='#dc2626')

    # ─── Use Case Ellipse ───
    def draw_uc(ax, x, y, text, color='#e3f2fd', edge='#1565c0', is_new=False):
        w, h = 3.0, 0.72
        ax.add_patch(mpatches.Ellipse((x, y), w, h, facecolor=color, edgecolor=edge,
                     linewidth=2.2 if is_new else 1.8, linestyle='--' if is_new else '-'))
        fs = 7 if len(text) > 32 else 7.5 if len(text) > 26 else 8 if len(text) > 20 else 8.5
        fw = 'bold' if is_new else 'normal'
        ax.text(x, y, text, fontsize=fs, ha='center', va='center', color='#1e293b', fontweight=fw)
        if is_new:
            ax.text(x + 1.5, y + 0.28, '*', fontsize=13, color='#dc2626', fontweight='bold')

    def line(ax, x1, y1, x2, y2, color='#94a3b8', ls='-', lw=1.3):
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw, linestyle=ls)

    # ═══ ACTORS ═══
    # ORIGINAL actors
    draw_actor(ax, 1.5, 14.0, 'Citizen', '#1e40af')
    draw_actor(ax, 24.5, 14.0, 'Central Admin', '#6b21a8')
    draw_actor(ax, 24.5, 5.5, 'Police Officer\n(Local Enforcer)', '#15803d')

    # NEW actor
    draw_actor(ax, 1.5, 5.5, 'Patrol Officer', '#c2410c', is_new=True)

    # ═══ CITIZEN USE CASES (left side, upper) ═══
    # ORIGINAL citizen use cases
    cit_orig = [
        (8, 17.5, 'Log In (User App)'),
        (8, 16.4, 'File Crime Report'),
        (8, 15.3, 'Upload Evidence'),
        (8, 14.2, 'View Report Status'),
        (8, 13.1, 'Submit Verification'),
    ]
    for x, y, text in cit_orig:
        draw_uc(ax, x, y, text, '#dbeafe', '#2563eb', False)
        line(ax, 2.1, 14.0, x - 1.5, y)

    # NEW citizen use case
    draw_uc(ax, 8, 12.0, 'Receive Verification\nResult', '#fff7ed', '#ea580c', True)
    line(ax, 2.1, 14.0, 8 - 1.5, 12.0)

    # ═══ PATROL OFFICER USE CASES (left side, lower) — ALL NEW ═══
    pat_uc = [
        (8, 10.0, 'Log In (Patrol App)'),
        (8, 8.9, 'Receive Dispatch\nNotification'),
        (8, 7.8, 'View Available\nDispatches'),
        (8, 6.7, 'Accept Dispatch'),
        (8, 5.6, 'Update Status\n(En Route / Arrived)'),
        (8, 4.5, 'Verify Report\n(Valid / Invalid)'),
        (8, 3.4, 'View Dispatch History'),
    ]
    for x, y, text in pat_uc:
        draw_uc(ax, x, y, text, '#fff7ed', '#ea580c', True)
        line(ax, 2.1, 5.5, x - 1.5, y)

    # ═══ CENTRAL ADMIN USE CASES (right side, upper) ═══
    # ORIGINAL admin use cases
    adm_orig = [
        (18, 17.5, 'Log In (Admin Portal)'),
        (18, 16.4, 'Access Admin Panel'),
        (18, 15.3, 'Manage All Reports'),
    ]
    for x, y, text in adm_orig:
        draw_uc(ax, x, y, text, '#f3e8ff', '#7c3aed', False)
        line(ax, 23.9, 14.0, x + 1.5, y)

    # ORIGINAL
    draw_uc(ax, 18, 14.2, 'Receive Verifications', '#f3e8ff', '#7c3aed', False)
    line(ax, 23.9, 14.0, 18 + 1.5, 14.2)

    draw_uc(ax, 18, 13.1, 'View Statistics', '#f3e8ff', '#7c3aed', False)
    line(ax, 23.9, 14.0, 18 + 1.5, 13.1)

    # NEW admin use cases
    adm_new = [
        (18, 12.0, 'Dispatch to Patrol'),
        (18, 10.9, 'Add Dispatch Notes'),
        (18, 9.8, 'View Dispatch Status'),
        (18, 8.7, 'View Response Time\nMetrics'),
    ]
    for x, y, text in adm_new:
        draw_uc(ax, x, y, text, '#fff7ed', '#ea580c', True)
        line(ax, 23.9, 14.0, x + 1.5, y)

    # Police Officer shares some admin use cases (dashed green lines)
    police_shared_ys = [12.0, 10.9, 9.8, 8.7, 14.2, 13.1]
    for sy in police_shared_ys:
        line(ax, 23.9, 5.5, 18 + 1.5, sy, '#16a34a', '--')

    # ═══ SHARED: Chat (both patrol & admin/police) — NEW ═══
    draw_uc(ax, 13, 2.2, 'Chat (Real-time\nMessaging)', '#fff7ed', '#ea580c', True)
    line(ax, 2.1, 5.5, 13 - 1.5, 2.2)           # patrol officer
    line(ax, 23.9, 14.0, 13 + 1.5, 2.2)          # admin
    line(ax, 23.9, 5.5, 13 + 1.5, 2.2, '#16a34a', '--')  # police

    # Police also connects to verify/dispatch viewing
    line(ax, 23.9, 5.5, 18 + 1.5, 8.7 + 1.1, '#16a34a', '--')

    # ─── LEGEND ───
    ax.add_patch(FancyBboxPatch((5, 0.25), 16, 0.7, boxstyle="round,pad=0.08",
                 facecolor='#f8fafc', edgecolor='#cbd5e1', linewidth=1))
    # Original ellipse
    ax.add_patch(mpatches.Ellipse((6.3, 0.6), 1.2, 0.38, facecolor='#dbeafe', edgecolor='#2563eb', linewidth=1.5))
    ax.text(6.3, 0.6, 'Original', fontsize=7.5, ha='center', va='center')
    # New ellipse
    ax.add_patch(mpatches.Ellipse((8.5, 0.6), 1.2, 0.38, facecolor='#fff7ed', edgecolor='#ea580c', linewidth=1.8, linestyle='--'))
    ax.text(8.5, 0.6, 'New *', fontsize=7.5, ha='center', va='center', fontweight='bold')
    # Lines
    line(ax, 10.2, 0.6, 11.2, 0.6, '#94a3b8', '-', 1.8)
    ax.text(11.5, 0.6, 'Primary', fontsize=8, va='center', color='#555')
    line(ax, 13, 0.6, 14, 0.6, '#16a34a', '--', 1.8)
    ax.text(14.3, 0.6, 'Police (shared)', fontsize=8, va='center', color='#555')
    ax.text(16.5, 0.6, '  Renamed: "Assign to Station" -> "Dispatch to Patrol"',
            fontsize=7.5, va='center', color='#888', style='italic')

    plt.tight_layout(pad=0.3)
    path = os.path.join(output_dir, '3_use_case_updated.png')
    plt.savefig(path, dpi=200, bbox_inches='tight', facecolor='white')
    plt.close()
    print(f'Saved: {path}')


if __name__ == '__main__':
    print('Generating updated diagrams (with original elements preserved)...\n')
    draw_conceptual_framework()
    draw_erd()
    draw_use_case()
    print(f'\nAll diagrams saved to: {output_dir}')
